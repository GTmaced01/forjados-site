import { WebhookSignatureValidator } from 'npm:mercadopago@3.6.1';
import { mp, PaymentError, reconcile, webhookSecret } from '../_shared/payment.ts';

// This public endpoint authenticates Mercado Pago using its signed notification.
Deno.serve(async req => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  if (!webhookSecret) return new Response(null, { status: 503 });
  const dataId = new URL(req.url).searchParams.get('data.id') || '';
  if (!/^\d{1,30}$/.test(dataId)) return new Response(null, { status: 400 });
  try {
    WebhookSignatureValidator.validate({ xSignature: req.headers.get('x-signature') || '',
      xRequestId: req.headers.get('x-request-id') || '', dataId, secret: webhookSecret });
  } catch { return new Response(null, { status: 401 }); }
  try {
    const payment = await mp(`/v1/payments/${dataId}`);
    if (!payment.ok) return new Response(null, { status: 503 });
    // No payment fields from the request body are ever trusted.
    await reconcile(await payment.json());
    return new Response(null, { status: 200 });
  } catch (err) {
    if (err instanceof PaymentError && err.status === 404) return new Response(null, { status: 200 });
    console.error('Webhook reconciliation failed', err instanceof PaymentError ? err.status : 'unexpected');
    return new Response(null, { status: 503 });
  }
});
