import { createClient } from 'npm:@supabase/supabase-js@2.110.2';

export const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
export const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-pago-webhook`;
export const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || '';
export const webhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET') || '';
export const mode = Deno.env.get('MERCADO_PAGO_MODE') || 'test';
export const ready = Deno.env.get('MERCADO_PAGO_ENABLED') === 'true' && Boolean(accessToken && webhookSecret) && ['test', 'production'].includes(mode);

export class PaymentError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export async function hash(value: string) {
  const result = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(result), b => b.toString(16).padStart(2, '0')).join('');
}
export function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
export function allowed(origin: string) {
  if (!origin) return true;
  try {
    const u = new URL(origin);
    return u.protocol === 'https:' && (['forjados-site-theta.vercel.app', 'forjados-site.vercel.app'].includes(u.hostname) || u.hostname.endsWith('-medeiros-dev1.vercel.app'));
  } catch { return false; }
}
export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  return origin && allowed(origin) ? {
    'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type,authorization,apikey,x-client-info', Vary: 'Origin',
  } : {};
}
export function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...cors(req),
  } });
}
export async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await db.rpc(name, args);
  if (error) {
    if (error.message.startsWith('CHECKOUT:')) throw new PaymentError(error.message.slice(9).trim(), 409);
    console.error('Payment database operation failed', name, error.code);
    throw new PaymentError('Serviço temporariamente indisponível. Tente novamente.', 503);
  }
  return data;
}
export async function limit(req: Request) {
  const { data, error } = await db.from('site_runtime_secrets').select('secret_value').eq('secret_name', 'registration_webhook').maybeSingle();
  if (error || !data?.secret_value) throw new PaymentError('Serviço temporariamente indisponível.', 503);
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(data.secret_value), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
  const ipHash = Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('');
  if (!(await rpc('site_payment_rate_limit', { p_hash: ipHash }))) throw new PaymentError('Muitas tentativas. Aguarde antes de tentar novamente.', 429);
}
export type Order = {
  id: string; access_hash: string; categoria: 'participante' | 'equipe'; quantity: number; total_cents: number;
  status: string; provider_id: string | null; provider_updated_at: string | null; updated_at: string;
  checkout_started_at: string | null; pix_code: string | null; pix_qr: string | null;
};
export async function authorized(id: unknown, token: unknown): Promise<Order> {
  if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/i.test(id) || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new PaymentError('Sessão de pagamento inválida.', 401);
  const { data, error } = await db.from('site_payment_orders').select('*').eq('id', id).maybeSingle();
  if (error) throw new PaymentError('Não foi possível consultar o pagamento.', 503);
  if (!data || !same(data.access_hash, await hash(token))) throw new PaymentError('Sessão de pagamento inválida.', 401);
  return data;
}
export function summary(order: Order) {
  return { id: order.id, categoria: order.categoria, quantity: order.quantity, total: order.total_cents / 100,
    checkoutStarted: Boolean(order.checkout_started_at),
    status: order.status, paymentId: order.provider_id, pixCode: order.status === 'pending' ? order.pix_code : null,
    pixQr: order.status === 'pending' ? order.pix_qr : null };
}
// Only the original canonical request is retried, with the same idempotency key.
export async function mp(path: string, init: RequestInit = {}) {
  return fetch(`https://api.mercadopago.com${path}`, { ...init, headers: {
    Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...init.headers,
  }, signal: AbortSignal.timeout(12000) });
}
let collector: number | null = null;
export async function reconcile(payment: Record<string, unknown>) {
  const id = String(payment.id || '');
  const orderId = String(payment.external_reference || '');
  if (!/^\d+$/.test(id) || !/^[a-f0-9-]{36}$/i.test(orderId)) throw new PaymentError('Pagamento não vinculado.', 404);
  const { data: order, error } = await db.from('site_payment_orders').select('*').eq('id', orderId).maybeSingle();
  if (error) throw new PaymentError('Não foi possível consultar o pedido.', 503);
  if (!order) throw new PaymentError('Pagamento não vinculado.', 404);
  if (!collector) {
    const response = await mp('/users/me');
    if (!response.ok) throw new PaymentError('Não foi possível verificar o recebedor.', 503);
    collector = Number((await response.json()).id);
  }
  if (!collector || Number(payment.collector_id) !== collector || payment.currency_id !== 'BRL' ||
      Math.round(Number(payment.transaction_amount) * 100) !== order.total_cents ||
      payment.live_mode !== (mode === 'production') ||
      (order.provider_id && order.provider_id !== id && !['rejected','cancelled'].includes(String(payment.status)))) {
    throw new PaymentError('Pagamento não corresponde ao pedido.', 409);
  }
  const accountMoney = payment.payment_method_id === 'account_money' && payment.payment_type_id === 'account_money';
  if (payment.payment_method_id !== 'pix' && !accountMoney && (payment.payment_type_id !== 'credit_card' ||
      !Number.isInteger(payment.installments) || Number(payment.installments) < 1 || Number(payment.installments) > 3)) {
    throw new PaymentError('Forma de pagamento não permitida.', 409);
  }
  const status = Number(payment.transaction_amount_refunded || 0) > 0 ? 'refunded' : String(payment.status || '');
  if (!['approved', 'pending', 'in_process', 'authorized', 'rejected', 'cancelled', 'refunded', 'charged_back'].includes(status)) throw new PaymentError('Status de pagamento desconhecido.', 503);
  const info = payment.point_of_interaction as { transaction_data?: { qr_code?: string; qr_code_base64?: string } } | undefined;
  const updated = String(payment.date_last_updated || payment.date_created || '');
  if (!updated || !Number.isFinite(Date.parse(updated))) throw new PaymentError('Data do pagamento inválida.', 503);
  await rpc('site_payment_reconcile', { p_id: orderId, p_provider: id, p_status: status, p_updated: updated,
    p_pix_code: info?.transaction_data?.qr_code || null, p_pix_qr: info?.transaction_data?.qr_code_base64 || null });
  const { data: refreshed, error: refreshError } = await db.from('site_payment_orders').select('*').eq('id', orderId).single();
  if (refreshError) throw new PaymentError('Não foi possível consultar o resultado.', 503);
  return refreshed as Order;
}
export async function refresh(order: Order) {
  if (!order.provider_id) return order;
  const response = await mp(`/v1/payments/${order.provider_id}`);
  if (!response.ok) throw new PaymentError('Não foi possível atualizar o pagamento agora.', 503);
  return reconcile(await response.json());
}
