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
    provider_request: null, pix_code: null, pix_qr: null, updated_at: new Date().toISOString(), ...options.order };
  const payments = [];
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
      if (name === 'site_payment_begin') {
        if (!order.provider_request) order.provider_request = args.p_request;
        order.status = 'submitting';
        return { data: order.provider_request, error: null };
      }
      if (name === 'site_payment_reconcile') {
        Object.assign(order, { provider_id: args.p_provider, status: args.p_status, provider_request: null });
      }
      if (name === 'site_payment_fail') {
        Object.assign(order, { status: 'failed', provider_request: null });
      }
      return { data: null, error: null };
    },
  };
  const providerPayment = () => ({ id: 123, external_reference: id, collector_id: 456, currency_id: 'BRL',
    transaction_amount: 180, live_mode: true, installments: 1, payment_method_id: 'visa', payment_type_id: 'credit_card',
    status: 'approved', date_last_updated: '2026-10-05T12:00:00Z', ...options.provider });
  const fetch = async (url, init = {}) => {
    if (url.endsWith('/users/me')) return Response.json({ id: 456 });
    if (url.endsWith('/v1/payment_methods')) return Response.json([{ id: 'visa', payment_type_id: 'credit_card' }, { id: 'visa_debit', payment_type_id: 'debit_card' }]);
    if (init.method === 'POST') {
      payments.push({ request: JSON.parse(init.body), key: init.headers['X-Idempotency-Key'] });
      if (options.timeout) throw new Error('simulated lost response');
      if (options.providerHttpStatus) return Response.json({ cause: [{ code: 7 }] }, { status: options.providerHttpStatus });
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
  return { order, payments, token, id, env, handler,
    call: body => handler(new Request('https://example.supabase.co/functions/v1/site-payment', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://forjados-site-theta.vercel.app' }, body: JSON.stringify(body),
    })),
  };
}
const card = { transaction_amount: 0.01, payment_method_id: 'visa', installments: 3, token: 'mock-card-token',
  payer: { email: 'payer@example.invalid', identification: { type: 'CPF', number: '52998224725' } } };

test('no credentials: checkout stays blocked and no payment is sent', async () => {
  const h = harness({ env: { MERCADO_PAGO_ACCESS_TOKEN: '' } });
  const config = await (await h.call({ action: 'config' })).json();
  assert.equal(config.ready, false); assert.equal(config.publicKey, null);
  assert.equal((await h.call({ action: 'create', id: h.id, token: h.token, formData: card })).status, 503);
  assert.equal(h.payments.length, 0);
});
test('client price is ignored and the stable order id is used as idempotency key', async () => {
  const h = harness();
  const response = await h.call({ action: 'create', id: h.id, token: h.token, formData: card });
  assert.equal(response.status, 200);
  assert.equal(h.payments[0].request.transaction_amount, 180);
  assert.equal(h.payments[0].request.installments, 3);
  assert.equal(h.payments[0].key, h.id);
  assert.equal(h.order.provider_request, null);
});
test('installments above three and debit card are refused before charging', async () => {
  for (const formData of [{ ...card, installments: 4 }, { ...card, payment_method_id: 'visa_debit' }]) {
    const h = harness();
    assert.equal((await h.call({ action: 'create', id: h.id, token: h.token, formData })).status, 400);
    assert.equal(h.payments.length, 0);
  }
});
test('checkout shows separate Pix and card choices and offers card installments from 1x to 3x', () => {
  const source = readFileSync(resolve(__dirname, '../app/pagamento/_components/PaymentFlow.tsx'), 'utf8');
  assert.match(source, /Cartão de crédito/);
  assert.match(source, /QR Code e código Copia e Cola/);
  assert.match(source, /creditCard: "all", minInstallments: 1, maxInstallments: 3/);
  assert.match(source, /bankTransfer: "pix", minInstallments: 1, maxInstallments: 1/);
  assert.match(source, /defaultPaymentOption: paymentMethod === "card"/);
  assert.match(source, /secondarySuccessColor/);
  assert.doesNotMatch(source, /successSecondaryColor/);
});
test('Pix uses the CPF from the linked registration when Payment Brick sends only email', async () => {
  const h = harness({ provider: { payment_method_id: 'pix', payment_type_id: 'bank_transfer', status: 'pending' } });
  const response = await h.call({ action: 'create', id: h.id, token: h.token,
    formData: { payment_method_id: 'pix', payer: { email: 'payer@example.invalid' } } });
  assert.equal(response.status, 200);
  assert.deepEqual(h.payments[0].request.payer, {
    email: 'payer@example.invalid', identification: { type: 'CPF', number: '52998224725' },
  });
  assert.equal(h.payments[0].request.installments, 1);
});
test('wrong capability cannot view or create a payment', async () => {
  const h = harness();
  assert.equal((await h.call({ action: 'status', id: h.id, token: 'b'.repeat(64) })).status, 401);
  assert.equal(h.payments.length, 0);
});
test('unknown outcome preserves canonical request and exact retry identity', async () => {
  const h = harness({ timeout: true });
  assert.equal((await h.call({ action: 'create', id: h.id, token: h.token, formData: card })).status, 503);
  assert.equal(h.order.status, 'submitting');
  assert.equal((await h.call({ action: 'create', id: h.id, token: h.token, formData: { ...card, token: 'different' } })).status, 503);
  assert.deepEqual(h.payments[0], h.payments[1]);
});
test('provider authentication failure releases the attempt without confirming payment', async () => {
  const h = harness({ providerHttpStatus: 401 });
  const response = await h.call({ action: 'create', id: h.id, token: h.token, formData: card });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /revisar as credenciais/);
  assert.equal(h.order.status, 'failed');
  assert.equal(h.order.provider_request, null);
  assert.equal(h.order.provider_id, null);
});
test('provider server failure keeps the original attempt reserved for safe retry', async () => {
  const h = harness({ providerHttpStatus: 500 });
  assert.equal((await h.call({ action: 'create', id: h.id, token: h.token, formData: card })).status, 503);
  assert.equal(h.order.status, 'submitting');
  assert.equal(h.order.provider_request.token, card.token);
});
test('group total comes from server order, not quantity or price from the browser', async () => {
  const h = harness({ order: { quantity: 2, total_cents: 36000 }, provider: { transaction_amount: 360 } });
  assert.equal((await h.call({ action: 'create', id: h.id, token: h.token, formData: card, quantity: 99 })).status, 200);
  assert.equal(h.payments[0].request.transaction_amount, 360);
});
test('foreign collector, mismatched amount and wrong environment never confirm payment', async () => {
  for (const provider of [{ collector_id: 987 }, { transaction_amount: 0.01 }, { live_mode: false }]) {
    const h = harness({ provider });
    assert.equal((await h.call({ action: 'create', id: h.id, token: h.token, formData: card })).status, 409);
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
