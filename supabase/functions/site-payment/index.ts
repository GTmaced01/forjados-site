import { allowed, authorized, cors, db, hash, json, limit, mode, mp, PaymentError, publicKey, ready, reconcile, refresh, rpc, summary, webhookUrl } from '../_shared/payment.ts';

type Person = { cpf: string; email: string };
function safeProviderText(value: unknown) {
  return String(value || '')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]')
    .replace(/\b\d{9,}\b/g, '[number]')
    .replace(/[^\p{L}\p{N}\s.,:;_()\/-]/gu, '')
    .trim().slice(0, 180);
}
function trustedCheckoutUrl(value: unknown) {
  try {
    const url = new URL(String(value || ''));
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && (host === 'mercadopago.com' || host.endsWith('.mercadopago.com') ||
      host === 'mercadopago.com.br' || host.endsWith('.mercadopago.com.br')) ? url.toString() : null;
  } catch { return null; }
}
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
async function registrationPayer(orderId: string) {
  const { data: item, error: itemError } = await db.from('site_payment_order_items')
    .select('inscrito_id').eq('order_id', orderId).eq('active', true)
    .order('inscrito_id', { ascending: true }).limit(1).maybeSingle();
  if (itemError || !item?.inscrito_id) throw new PaymentError('Não foi possível identificar o pagador.', 503);
  const { data: registration, error } = await db.from('inscritos')
    .select('cpf,email').eq('id', item.inscrito_id).maybeSingle();
  const cpf = String(registration?.cpf || '').replace(/\D/g, '');
  const email = String(registration?.email || '').trim().toLowerCase();
  if (error || !/^\d{11}$/.test(cpf) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new PaymentError('Não foi possível identificar o pagador.', 503);
  }
  return { cpf, email };
}
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
  let email = String(payer?.email || '').trim().toLowerCase();
  let document = String(payer?.identification?.number || '').replace(/\D/g, '');
  let documentType = String(payer?.identification?.type || '');
  // Payment Brick returns only the payer email for Pix. The CPF comes from the
  // already authenticated registration linked to this server-side order.
  if (pix && (!/^\d{11}$|^\d{14}$/.test(document) || !['CPF', 'CNPJ'].includes(documentType))) {
    const registration = await registrationPayer(orderId);
    document = registration.cpf;
    documentType = 'CPF';
    if (!email) email = registration.email;
  }
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
async function checkoutPreference(order: { id: string; categoria: string; quantity: number; total_cents: number }) {
  // Reuse an existing preference for this order so repeated clicks or a lost
  // browser response cannot create multiple checkout links.
  const search = await mp(`/checkout/preferences/search?external_reference=${encodeURIComponent(order.id)}`);
  if (!search.ok) throw new PaymentError('Não foi possível preparar o redirecionamento agora. Tente novamente.', 503);
  const searchBody = await search.json().catch(() => null);
  const existing = Array.isArray(searchBody?.elements) ? searchBody.elements.find((item: Record<string, unknown>) =>
    item?.external_reference === order.id && trustedCheckoutUrl(mode === 'test' ? item?.sandbox_init_point : item?.init_point)) : null;
  if (existing) return trustedCheckoutUrl(mode === 'test' ? existing.sandbox_init_point : existing.init_point)!;

  const base = order.categoria === 'equipe'
    ? 'https://forjados-site-theta.vercel.app/pagamentoequipe'
    : 'https://forjados-site-theta.vercel.app/pagamento';
  const unitPrice = order.total_cents / 100 / order.quantity;
  const preference = {
    items: [{
      id: order.categoria,
      title: order.categoria === 'equipe' ? 'Inscrição FORJADOS - Equipe' : 'Inscrição FORJADOS - Participante',
      description: `${order.quantity} ${order.quantity === 1 ? 'inscrição' : 'inscrições'} FORJADOS`,
      quantity: order.quantity,
      currency_id: 'BRL',
      unit_price: unitPrice,
    }],
    external_reference: order.id,
    notification_url: webhookUrl,
    back_urls: {
      success: `${base}?retorno=success`,
      pending: `${base}?retorno=pending`,
      failure: `${base}?retorno=failure`,
    },
    auto_return: 'approved',
    payment_methods: {
      excluded_payment_types: [{ id: 'ticket' }, { id: 'debit_card' }, { id: 'prepaid_card' }],
      installments: 3,
    },
    statement_descriptor: 'FORJADOS',
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    metadata: { site_order_id: order.id, category: order.categoria },
  };
  const response = await mp('/checkout/preferences', {
    method: 'POST', headers: { 'X-Idempotency-Key': order.id }, body: JSON.stringify(preference),
  });
  const created = await response.json().catch(() => null);
  if (!response.ok) {
    console.error('Mercado Pago preference rejected', {
      status: response.status, error: safeProviderText(created?.error), message: safeProviderText(created?.message),
    });
    throw new PaymentError(response.status === 401
      ? 'A organização precisa revisar as credenciais do Mercado Pago.'
      : 'O Mercado Pago não conseguiu abrir o checkout agora. Tente novamente.', response.status === 401 ? 503 : 502);
  }
  const url = trustedCheckoutUrl(mode === 'test' ? created?.sandbox_init_point : created?.init_point);
  if (!url) throw new PaymentError('O Mercado Pago não devolveu um endereço de pagamento válido.', 503);
  return url;
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
    if (input.action === 'checkout') {
      if (order.status !== 'prepared' || order.provider_id) {
        throw new PaymentError('Este pedido já possui uma tentativa de pagamento. Consulte o resultado ou inicie um novo pedido.', 409);
      }
      return json(req, { checkoutUrl: await checkoutPreference(order), order: summary(order) });
    }
    if (input.action !== 'create') throw new PaymentError('Operação inválida.');
    if (order.provider_id || !['prepared', 'submitting'].includes(order.status)) return json(req, { order: summary(await refresh(order)) });
    const canonical = order.provider_request || await payload((input.formData || {}) as Record<string, unknown>, order.total_cents / 100, order.id);
    const stored = await rpc('site_payment_begin', { p_id: order.id, p_hash: order.access_hash, p_request: canonical });
    if (!stored) return json(req, { order: summary(await authorized(order.id, input.token)) });
    const response = await mp('/v1/payments', { method: 'POST', headers: { 'X-Idempotency-Key': order.id }, body: JSON.stringify(stored) });
    const payment = await response.json().catch(() => null);
    if (!response.ok) {
      // Keep enough sanitized provider detail to diagnose rejections without
      // placing payer data or card tokens in logs.
      const causes = Array.isArray(payment?.cause) ? payment.cause.slice(0, 10)
        .map((cause: { code?: unknown; description?: unknown }) => ({
          code: String(cause?.code || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32),
          description: safeProviderText(cause?.description),
        })).filter((cause: { code: string; description: string }) => cause.code || cause.description) : [];
      console.error('Mercado Pago payment rejected', {
        status: response.status,
        error: safeProviderText(payment?.error),
        message: safeProviderText(payment?.message),
        causes,
      });
      // A rejected authentication never creates a payment; release this attempt.
      if (response.status === 401) {
        await rpc('site_payment_fail', { p_id: order.id });
        throw new PaymentError('A organização precisa revisar as credenciais do Mercado Pago. Nenhum pagamento foi confirmado.', 503);
      }
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
