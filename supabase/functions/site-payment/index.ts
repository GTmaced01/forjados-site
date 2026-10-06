import { allowed, authorized, cors, hash, json, limit, mode, mp, PaymentError, ready, reconcile, refresh, rpc, summary, webhookUrl } from '../_shared/payment.ts';

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
async function checkoutPreference(order: { id: string; categoria: string; quantity: number; total_cents: number }) {
  if (mode === 'test') {
    const sellerResponse = await mp('/users/me');
    const seller = sellerResponse.ok ? await sellerResponse.json().catch(() => null) : null;
    if (!Array.isArray(seller?.tags) || !seller.tags.includes('test_user')) {
      throw new PaymentError('A credencial configurada não pertence a um vendedor de teste. Revise o Access Token de teste no Supabase.', 503);
    }
  }
  // Reuse an existing preference for this order so repeated clicks or a lost
  // browser response cannot create multiple checkout links.
  const search = await mp(`/checkout/preferences/search?external_reference=${encodeURIComponent(order.id)}`);
  if (!search.ok) throw new PaymentError('Não foi possível preparar o redirecionamento agora. Tente novamente.', 503);
  const searchBody = await search.json().catch(() => null);
  const existing = Array.isArray(searchBody?.elements) ? searchBody.elements.find((item: Record<string, unknown>) =>
    item?.external_reference === order.id) : null;
  if (existing) {
    // Search returns a summary; the detail endpoint supplies the checkout URL.
    if (!/^[a-zA-Z0-9-]{1,100}$/.test(String(existing.id || ''))) throw new PaymentError('Preferência inválida.', 503);
    const detailResponse = await mp(`/checkout/preferences/${existing.id}`);
    if (!detailResponse.ok) throw new PaymentError('Não foi possível consultar o checkout existente.', 503);
    const detail = await detailResponse.json().catch(() => null);
    if (detail?.external_reference !== order.id) throw new PaymentError('Preferência divergente.', 503);
    if (Date.parse(String(detail.expiration_date_to || '')) <= Date.now()) {
      throw new PaymentError('O prazo deste checkout terminou. Consulte a organização antes de iniciar outro pagamento.', 409);
    }
    const url = trustedCheckoutUrl(detail.init_point);
    if (!url) throw new PaymentError('Não foi possível verificar o endereço do checkout.', 503);
    return url;
  }

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
  // Mercado Pago's Checkout Pro test purchases use the regular init_point;
  // test credentials and a test buyer determine the simulated environment.
  const url = trustedCheckoutUrl(created?.init_point);
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
    if (input.action === 'config') return json(req, { ready, mode });
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
      // The signed webhook is primary. A return from Checkout Pro also verifies
      // the payment directly with the provider; never trust URL status fields.
      let refreshed = order.provider_id && Date.now() - Date.parse(order.updated_at) >= 15000 ? await refresh(order) : order;
      if (input.recover === true && order.checkout_started_at && !order.provider_id) {
        const response = await mp(`/v1/payments/search?external_reference=${encodeURIComponent(order.id)}&limit=10`);
        if (!response.ok) throw new PaymentError('Resultado ainda indisponível. Consulte novamente.', 503);
        const payments = (await response.json().catch(() => null))?.results;
        if (!Array.isArray(payments)) throw new PaymentError('Resultado ainda indisponível. Consulte novamente.', 503);
        const active = payments.filter((payment: Record<string, unknown>) => !['rejected','cancelled'].includes(String(payment.status)));
        if (active.length > 1) throw new PaymentError('Há mais de uma tentativa. Consulte a organização para verificar o resultado.', 409);
        if (active.length === 1) refreshed = await reconcile(active[0]);
      }
      return json(req, { order: summary(refreshed) });
    }
    if (input.action === 'checkout') {
      if (order.status !== 'prepared' || order.provider_id) {
        throw new PaymentError('Este pedido já possui uma tentativa de pagamento. Consulte o resultado ou inicie um novo pedido.', 409);
      }
      await rpc('site_payment_checkout_start', { p_id: order.id, p_hash: order.access_hash });
      return json(req, { checkoutUrl: await checkoutPreference(order), order: summary(order) });
    }
    throw new PaymentError('Operação inválida.');
  } catch (err) {
    const known = err instanceof PaymentError;
    if (!known) console.error('Payment request failed', err instanceof Error ? err.name : 'unknown');
    return json(req, { error: known ? err.message : 'Não foi possível confirmar o resultado. Consulte o pagamento antes de tentar novamente.' }, known ? err.status : 503);
  }
});
