-- Run as one batch. Fixtures and queued registration notifications are rolled back.
begin;
do $$
declare
  a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); t uuid:=gen_random_uuid(); c uuid:=gen_random_uuid();
  o uuid:=gen_random_uuid(); o2 uuid:=gen_random_uuid(); ot uuid:=gen_random_uuid(); oc uuid:=gen_random_uuid();
  h text:=repeat('a',64); persons jsonb; first_request jsonb; result jsonb;
begin
  insert into public.inscritos(id,nome,cpf,telefone,email,categoria,pagamento_status) values
    (a,'Teste transacional A','00000000001','00000000000',a::text||'@example.invalid','participante','pendente'),
    (b,'Teste transacional B','00000000002','00000000000',b::text||'@example.invalid','participante','pendente'),
    (t,'Teste transacional equipe','00000000003','00000000000',t::text||'@example.invalid','equipe','pendente'),
    (c,'Teste reserva checkout','00000000004','00000000000',c::text||'@example.invalid','equipe','pendente');
  persons:=jsonb_build_array(jsonb_build_object('cpf','00000000001','email',a::text||'@example.invalid'),jsonb_build_object('cpf','00000000002','email',b::text||'@example.invalid'));
  perform public.site_payment_prepare(o,h,'participante',persons);
  if not exists(select 1 from public.site_payment_orders where id=o and total_cents=36000 and quantity=2) then raise exception 'wrong group total'; end if;
  perform public.site_payment_prepare(o,h,'participante',persons);
  if (select count(*) from public.site_payment_order_items where order_id=o)<>2 then raise exception 'prepare not idempotent'; end if;
  begin
    perform public.site_payment_prepare(o2,h,'participante',persons);
    raise exception 'duplicate active payment accepted';
  exception when raise_exception then if sqlerrm not like 'CHECKOUT:%' then raise; end if; end;
  begin
    perform public.site_payment_prepare(ot,h,'participante',jsonb_build_array(jsonb_build_object('cpf','00000000003','email',t::text||'@example.invalid')));
    raise exception 'wrong category accepted';
  exception when raise_exception then if sqlerrm not like 'CHECKOUT:%' then raise; end if; end;
  perform public.site_payment_prepare(oc,h,'equipe',jsonb_build_array(jsonb_build_object('cpf','00000000004','email',c::text||'@example.invalid')));
  perform public.site_payment_checkout_start(oc,h);
  update public.site_payment_orders set created_at=now()-interval '20 minutes' where id=oc;
  begin
    perform public.site_payment_abandon(oc,h);
    raise exception 'issued checkout was abandoned';
  exception when raise_exception then if sqlerrm not like 'CHECKOUT:%' then raise; end if; end;
  perform public.site_payment_prepare(ot,h,'equipe',jsonb_build_array(jsonb_build_object('cpf','00000000003','email',t::text||'@example.invalid')));
  if not exists(select 1 from public.site_payment_order_items where order_id=oc and active) then raise exception 'issued checkout was released after 15 minutes'; end if;
  first_request:=jsonb_build_object('transaction_amount',360,'external_reference',o::text,'installments',3,'token','test-token');
  begin
    perform public.site_payment_begin(o,h,first_request||'{"transaction_amount":1}'::jsonb);
    raise exception 'client price accepted';
  exception when raise_exception then if sqlerrm not like 'CHECKOUT:%' then raise; end if; end;
  begin
    perform public.site_payment_begin(o,h,first_request||'{"installments":4}'::jsonb);
    raise exception '4 installments accepted';
  exception when raise_exception then if sqlerrm not like 'CHECKOUT:%' then raise; end if; end;
  result:=public.site_payment_begin(o,h,first_request);
  if result<>first_request then raise exception 'initial payload not persisted'; end if;
  result:=public.site_payment_begin(o,h,first_request||'{"token":"different-token"}'::jsonb);
  if result<>first_request then raise exception 'retry replaced canonical request'; end if;
  perform public.site_payment_reconcile(o,'900000001','approved','2026-10-05T12:00:00Z',null,null);
  perform public.site_payment_reconcile(o,'900000001','approved','2026-10-05T12:00:00Z',null,null);
  perform public.site_payment_reconcile(o,'900000001','pending','2026-10-05T11:59:00Z',null,null);
  if (select count(*) from public.inscritos where id in (a,b) and pagamento_status='pago' and pagamento_id='900000001')<>2 then raise exception 'group or stale notification broke payment status'; end if;
  if exists(select 1 from public.site_payment_orders where id=o and provider_request is not null) then raise exception 'card token not cleared'; end if;
  perform public.site_payment_reconcile(o,'900000001','refunded','2026-10-05T12:01:00Z',null,null);
  if (select count(*) from public.inscritos where id in (a,b) and pagamento_status='estornado')<>2 then raise exception 'refund not reconciled'; end if;
  perform public.site_payment_prepare(o2,h,'participante',persons);
  perform public.site_payment_reconcile(o,'900000001','approved','2026-10-05T12:02:00Z',null,null);
  if exists(select 1 from public.inscritos where id in (a,b) and pagamento_status='pago') then raise exception 'old order overwrote new order'; end if;
  perform public.site_payment_abandon(o2,h);
  if exists(select 1 from public.site_payment_order_items where order_id=o2 and active) then raise exception 'unsubmitted order not released'; end if;
  perform public.site_payment_prepare(ot,h,'equipe',jsonb_build_array(jsonb_build_object('cpf','00000000003','email',t::text||'@example.invalid')));
  if not exists(select 1 from public.site_payment_orders where id=ot and total_cents=9000) then raise exception 'wrong team price'; end if;
  perform public.site_payment_begin(ot,h,jsonb_build_object('transaction_amount',90,'external_reference',ot::text,'installments',1));
  perform public.site_payment_fail(ot);
  if exists(select 1 from public.site_payment_order_items where order_id=ot and active) then raise exception 'failed payment remains locked'; end if;
  if has_table_privilege('anon','public.site_payment_orders','select') or has_table_privilege('authenticated','public.site_payment_orders','select') or
     has_function_privilege('anon','public.site_payment_reconcile(uuid,text,text,timestamptz,text,text)','execute') or
     has_function_privilege('authenticated','public.site_payment_prepare(uuid,text,text,jsonb)','execute') then raise exception 'private payment access exposed'; end if;
end $$;
rollback;
select 'PASS: prices, quantity, category, duplicate reservations, idempotency, max 3x, group approval, webhook replay, refund, issued-checkout reservation, abandonment, failed attempt, private access; all fixtures rolled back' as verification;
