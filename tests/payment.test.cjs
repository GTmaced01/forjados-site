const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const { createHash, createHmac } = require('node:crypto');
const ts = require('typescript');

function harness(options = {}) {
  const token = 'a'.repeat(64);
  const id = '10000000-0000-4000-8000-000000000001';
  const order = { id, access_hash: createHash('sha256').update(token).digest('hex'), categoria: 'participante',
    quantity: 1, total_cents: 18000, status: 'prepared', provider_id: null, provider_updated_at: null,
    checkout_started_at: null, pix_code: null, pix_qr: null, updated_at: new Date().toISOString(), ...options.order };
  const payments = [];
  const preferences = [];
  let handler;
  const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role',
    MERCADO_PAGO_PUBLIC_KEY: 'mock-public', MERCADO_PAGO_ACCESS_TOKEN: 'mock-access', MERCADO_PAGO_WEBHOOK_SECRET: 'mock-signature-secret',
    MERCADO_PAGO_ENABLED: 'true', MERCADO_PAGO_MODE: 'production', ...options.env };
  const database = {
    from(table) {
      const query = { select() { return query; }, eq() { return query; }, order() { return query; }, limit() { return query; },
        maybeSingle: async () => ({ data: table === 'site_runtime_secrets' ? { secret_value: 'mock-rate-secret' }
          : table === 'site_payment_order_items' ? { inscrito_id: 'mock-registration' }
          : table === 'inscritos' ? { cpf: '529.982.247-25', email: 'registration@example.invalid' }
          : order, error: null }),
        single: async () => ({ data: order, error: null }),
      }; return query;
    },
    async rpc(name, args) {
      if (name === 'site_payment_rate_limit') return { data: options.rateAllowed !== false, error: null };
      if (name === 'site_payment_checkout_start') order.checkout_started_at = new Date().toISOString();
      if (name === 'site_payment_reconcile') {
        Object.assign(order, { provider_id: args.p_provider, status: args.p_status });
      }
      return { data: null, error: null };
    },
  };
  const providerPayment = () => ({ id: 123, external_reference: id, collector_id: 456, currency_id: 'BRL',
    transaction_amount: 180, live_mode: true, installments: 1, payment_method_id: 'visa', payment_type_id: 'credit_card',
    status: 'approved', date_last_updated: '2026-10-05T12:00:00Z', ...options.provider });
  const fetch = async (url, init = {}) => {
    if (url.endsWith('/users/me')) return Response.json({ id: 456 });
    if (url.includes('/v1/payments/search?')) return Response.json({ results: options.searchPayments || [] });
    if (url.includes('/checkout/preferences/search?')) return Response.json({ elements: options.existingPreference ? [options.existingPreference] : [] });
    if (url.endsWith('/checkout/preferences') && init.method === 'POST') {
      preferences.push({ request: JSON.parse(init.body), key: init.headers['X-Idempotency-Key'] });
      if (options.preferenceHttpStatus) return Response.json({ error: 'provider_unavailable' }, { status: options.preferenceHttpStatus });
      return Response.json({ id: 'mock-preference', init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock-preference',
        sandbox_init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=mock-preference' });
    }
    return Response.json(providerPayment());
  };
  let shared;
  function load(file) {
    const exports = {};
    const source = readFileSync(resolve(__dirname, '../supabase/functions', file), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
    vm.runInNewContext(code, { exports, require: name => {
      if (name.startsWith('npm:@supabase/')) return { createClient: () => database };
      if (name.startsWith('npm:mercadopago')) return require('mercadopago');
      if (name === '../_shared/payment.ts') return shared;
      throw new Error(`Unexpected module: ${name}`);
    }, Deno: { env: { get: name => env[name] }, serve: fn => { handler = fn; } },
    crypto: globalThis.crypto, Request, Response, URL, TextEncoder, Uint8Array, AbortSignal, fetch,
    console: { error() {} }, Date, Set, Array, JSON, Number, String, Math });
    return exports;
  }
  shared = load('_shared/payment.ts');
  load(options.webhook ? 'mercado-pago-webhook/index.ts' : 'site-payment/index.ts');
  return { order, payments, preferences, token, id, env, handler,
    call: body => handler(new Request('https://example.supabase.co/functions/v1/site-payment', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://forjados-site-theta.vercel.app' }, body: JSON.stringify(body),
    })),
  };
}
test('no credentials: checkout stays blocked and no payment is sent', async () => {
  const h = harness({ env: { MERCADO_PAGO_ACCESS_TOKEN: '' } });
  const config = await (await h.call({ action: 'config' })).json();
  assert.equal(config.ready, false);
  assert.equal((await h.call({ action: 'checkout', id: h.id, token: h.token })).status, 503);
  assert.equal(h.preferences.length, 0);
});
test('legacy direct payment cannot be called', async () => {
  const h = harness();
  assert.equal((await h.call({ action: 'create', id: h.id, token: h.token, formData: { token: 'card' } })).status, 400);
  assert.equal(h.payments.length, 0);
});
test('checkout redirects to Mercado Pago and leaves Pix/card selection to Checkout Pro', () => {
  const source = readFileSync(resolve(__dirname, '../app/pagamento/_components/PaymentFlow.tsx'), 'utf8');
  assert.match(source, /Cartão de crédito/);
  assert.match(source, /QR Code e código Copia e Cola/);
  assert.match(source, /action: "checkout"/);
  assert.match(source, /window\.location\.assign/);
  assert.match(source, /Pagar \$\{money\(order\.total\)\} no Mercado Pago/);
  assert.doesNotMatch(source, /sdk\.mercadopago\.com/);
});
test('Checkout Pro preference uses server total, webhook, return URLs and maximum of three installments', async () => {
  const h = harness({ order: { quantity: 2, total_cents: 36000 } });
  const response = await h.call({ action: 'checkout', id: h.id, token: h.token });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.match(body.checkoutUrl, /^https:\/\/www\.mercadopago\.com\.br\/checkout/);
  assert.equal(h.preferences.length, 1);
  const preference = h.preferences[0];
  assert.equal(preference.key, h.id);
  assert.equal(preference.request.external_reference, h.id);
  assert.equal(preference.request.items[0].quantity, 2);
  assert.equal(preference.request.items[0].unit_price, 180);
  assert.equal(preference.request.payment_methods.installments, 3);
  assert.deepEqual(Array.from(preference.request.payment_methods.excluded_payment_types, x => x.id), ['ticket','debit_card','prepaid_card']);
  assert.equal(h.order.checkout_started_at !== null, true);
  assert.equal(preference.request.notification_url, 'https://example.supabase.co/functions/v1/mercado-pago-webhook');
  assert.match(preference.request.back_urls.success, /pagamento\?retorno=success$/);
});
test('Checkout Pro reuses an existing preference for the same order', async () => {
  const h = harness({ existingPreference: { external_reference: '10000000-0000-4000-8000-000000000001',
    expiration_date_to: new Date(Date.now() + 3600000).toISOString(),
    init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=existing' } });
  const response = await h.call({ action: 'checkout', id: h.id, token: h.token });
  assert.equal(response.status, 200);
  assert.match((await response.json()).checkoutUrl, /pref_id=existing/);
  assert.equal(h.preferences.length, 0);
});
test('expired preference does not create a second payable link', async () => {
  const h = harness({ existingPreference: { external_reference: '10000000-0000-4000-8000-000000000001',
    expiration_date_to: new Date(Date.now() - 3600000).toISOString(), init_point: 'https://www.mercadopago.com.br/checkout/old' } });
  assert.equal((await h.call({ action: 'checkout', id: h.id, token: h.token })).status, 409);
  assert.equal(h.preferences.length, 0);
});
test('wrong capability cannot view or create a payment', async () => {
  const h = harness();
  assert.equal((await h.call({ action: 'status', id: h.id, token: 'b'.repeat(64) })).status, 401);
  assert.equal(h.payments.length, 0);
});
test('provider authentication failure never produces a checkout URL', async () => {
  const h = harness({ preferenceHttpStatus: 401 });
  const response = await h.call({ action: 'checkout', id: h.id, token: h.token });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /revisar as credenciais/);
  assert.equal(h.order.provider_id, null);
});
test('return consults the provider, not the redirect status', async () => {
  const h = harness({ order: { checkout_started_at: new Date().toISOString() }, searchPayments: [{ id: 123,
    external_reference: '10000000-0000-4000-8000-000000000001', collector_id: 456, currency_id: 'BRL',
    transaction_amount: 180, live_mode: true, installments: 1, payment_method_id: 'visa',
    payment_type_id: 'credit_card', status: 'approved', date_last_updated: '2026-10-05T12:00:00Z' }] });
  const response = await h.call({ action: 'status', id: h.id, token: h.token, recover: true });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).order.status, 'approved');
});
test('foreign collector, mismatched amount and wrong environment never confirm payment', async () => {
  for (const provider of [{ collector_id: 987 }, { transaction_amount: 0.01 }, { live_mode: false }]) {
    const base = { id: 123, external_reference: '10000000-0000-4000-8000-000000000001', collector_id: 456,
      currency_id: 'BRL', transaction_amount: 180, live_mode: true, installments: 1,
      payment_method_id: 'visa', payment_type_id: 'credit_card', status: 'approved', date_last_updated: '2026-10-05T12:00:00Z' };
    const h = harness({ order: { checkout_started_at: new Date().toISOString() }, searchPayments: [{ ...base, ...provider }] });
    assert.equal((await h.call({ action: 'status', id: h.id, token: h.token, recover: true })).status, 409);
    assert.notEqual(h.order.status, 'approved');
  }
});
test('rate limit and duplicate identities reject bulk preparation', async () => {
  const h = harness({ rateAllowed: false });
  assert.equal((await h.call({ action: 'prepare' })).status, 429);
  const h2 = harness();
  const person = { cpf: '52998224725', email: 'registration@example.invalid' };
  assert.equal((await h2.call({ action: 'prepare', id: h2.id, token: h2.token, categoria: 'participante', people: [person, person] })).status, 400);
});
test('webhook rejects forged signatures and trusts provider data rather than posted status', async () => {
  const h = harness({ webhook: true, provider: { status: 'pending', payment_method_id: 'pix', payment_type_id: 'bank_transfer' } });
  const url = 'https://example.supabase.co/functions/v1/mercado-pago-webhook?data.id=123';
  assert.equal((await h.handler(new Request(url, { method: 'POST' }))).status, 401);
  const ts = String(Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', h.env.MERCADO_PAGO_WEBHOOK_SECRET).update(`id:123;request-id:test-request;ts:${ts};`).digest('hex');
  const response = await h.handler(new Request(url, { method: 'POST', headers: { 'x-signature': `ts=${ts},v1=${signature}`, 'x-request-id': 'test-request' }, body: JSON.stringify({ status: 'approved' }) }));
  assert.equal(response.status, 200); assert.equal(h.order.status, 'pending');
});
