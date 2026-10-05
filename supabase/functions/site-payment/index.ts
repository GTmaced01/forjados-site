import { allowed, authorized, cors, db, hash, json, limit, mode, mp, PaymentError, publicKey, ready, reconcile, refresh, rpc, summary, webhookUrl } from '../_shared/payment.ts';

type Person = { cpf: string; email: string };
function people(value: unknown): Person[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) throw new PaymentError('Selecione de 1 a 20 pessoas.');
  const result = value.map(person => {
    const cpf = String(person?.cpf || '').replace(/\D/g, '');
    const email = String(person?.email || '').trim().toLowerCase();
    if (!/^\d{11}$/.test(cpf) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new PaymentError('Informe CPF e e-mail válidos para cada pessoa.');
    return { cpf, email };
  });
  if (new Set(result.map(person => person.cpf)).size !== result.length) throw new PaymentError('Cada pessoa deve aparecer uma única vez.');
  return result;
}
let methods: Array<{ id: string; payment_type_id: string }> | null = null;
async function payload(input: Record<string, unknown>, amount: number, orderId: string) {
  const method = String(input.payment_method_id || '');
  const pix = method === 'pix';
  const installments = pix ? 1 : Number(input.installments);
  if (!pix) {
    if (!Number.isInteger(installments) || installments < 1 || installments > 3 || !/^[a-zA-Z0-9_-]{1,60}$/.test(method) || typeof input.token !== 'string' || input.token.length > 512) throw new PaymentError('Cartão inválido ou parcelamento acima de 3x.');
    if (!methods) {
      const response = await mp('/v1/payment_methods');
      if (!response.ok) throw new PaymentError('Não foi possível consultar os meios de pagamento.', 503);
      methods = await response.json();
    }
    if (!methods?.some(item => item.id === method && item.payment_type_id === 'credit_card')) throw new PaymentError('Utilize Pix ou cartão de crédito.');
  }
  const payer = input.payer as { email?: unknown; identification?: { type?: unknown; number?: unknown } } | undefined;
  const email = String(payer?.email || '').trim().toLowerCase();
  const document = String(payer?.identification?.number || '').replace(/\D/g, '');
  const documentType = String(payer?.identification?.type || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      !(['CPF', 'CNPJ'].includes(documentType)) || !/^\d{11}$|^\d{14}$/.test(document)) throw new PaymentError('Preencha os dados do pagador no Mercado Pago.');
  return {
    transaction_amount: amount, description: 'FORJADOS - inscrições', payment_method_id: method,
    installments, payer: { email, identification: { type: documentType, number: document } },
    ...(pix ? { date_of_expiration: new Date(Date.now() + 60 * 60 * 1000).toISOString() } : { token: input.token,
      ...(String(input.issuer_id || '').match(/^\d{1,20}$/) ? { issuer_id: String(input.issuer_id) } : {}) }),
    external_reference: orderId, notification_url: webhookUrl,
  };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
  if (!allowed(req.headers.get('origin') || '')) return json(req, { error: 'Origem não permitida.' }, 403);
  if (req.method !== 'POST') return json(req, { error: 'Método não permitido.' }, 405);
  try {
    if (Number(req.headers.get('content-length') || 0) > 16000) throw new PaymentError('Envio muito grande.', 413);
    const raw = await req.text();
    if (raw.length > 16000) throw new PaymentError('Envio muito grande.', 413);
    let input: Record<string, unknown>;
    try { input = JSON.parse(raw); } catch { throw new PaymentError('Formato inválido.'); }
    if (!input || typeof input !== 'object') throw new PaymentError('Formato inválido.');
    if (input.action === 'config') return json(req, { ready, publicKey: ready ? publicKey : null, mode, prices: { participante: 180, equipe: 90 }, maxQuantity: 20, maxInstallments: 3 });
    if (!ready) throw new PaymentError('Os pagamentos ainda não foram liberados pela organização.', 503);

    if (input.action === 'prepare') {
      await limit(req);
      if (!['participante', 'equipe'].includes(String(input.categoria))) throw new PaymentError('Categoria inválida.');
      if (typeof input.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(input.id) || typeof input.token !== 'string' || !/^[a-f0-9]{64}$/.test(input.token)) throw new PaymentError('Sessão inválida.');
      const persons = people(input.people);
      await rpc('site_payment_prepare', { p_id: input.id, p_hash: await hash(input.token), p_category: input.categoria, p_people: persons });
      return json(req, { order: summary(await authorized(input.id, input.token)) });
    }
    const order = await authorized(input.id, input.token);
    if (input.action === 'abandon') {
      if (order.status !== 'prepared') throw new PaymentError('Um pagamento em andamento não pode ser reiniciado.', 409);
      await rpc('site_payment_abandon', { p_id: order.id, p_hash: order.access_hash });
      return json(req, { ok: true });
    }
    if (input.action === 'status') {
      // The signed webhook is primary; polling recovers missed notifications.
      const refreshed = order.provider_id && Date.now() - Date.parse(order.updated_at) >= 15000 ? await refresh(order) : order;
      return json(req, { order: summary(refreshed) });
    }
    if (input.action !== 'create') throw new PaymentError('Operação inválida.');
    if (order.provider_id || !['prepared', 'submitting'].includes(order.status)) return json(req, { order: summary(await refresh(order)) });
    const canonical = order.provider_request || await payload((input.formData || {}) as Record<string, unknown>, order.total_cents / 100, order.id);
    const stored = await rpc('site_payment_begin', { p_id: order.id, p_hash: order.access_hash, p_request: canonical });
    if (!stored) return json(req, { order: summary(await authorized(order.id, input.token)) });
    const response = await mp('/v1/payments', { method: 'POST', headers: { 'X-Idempotency-Key': order.id }, body: JSON.stringify(stored) });
    const payment = await response.json().catch(() => null);
    if (!response.ok) {
      // Unknown outcomes stay locked and retry the exact original request.
      if (response.status === 400 || response.status === 422) {
        await rpc('site_payment_fail', { p_id: order.id });
        throw new PaymentError('O Mercado Pago não aceitou os dados. Consulte o resultado e inicie uma nova tentativa.', 422);
      }
      throw new PaymentError('Não foi possível confirmar o resultado. Use Consultar pagamento antes de tentar novamente.', 503);
    }
    if (!payment?.id) throw new PaymentError('Resultado ainda indisponível. Consulte o pagamento.', 503);
    return json(req, { order: summary(await reconcile(payment)) });
  } catch (err) {
    const known = err instanceof PaymentError;
    if (!known) console.error('Payment request failed', err instanceof Error ? err.name : 'unknown');
    return json(req, { error: known ? err.message : 'Não foi possível confirmar o resultado. Consulte o pagamento antes de tentar novamente.' }, known ? err.status : 503);
  }
});
