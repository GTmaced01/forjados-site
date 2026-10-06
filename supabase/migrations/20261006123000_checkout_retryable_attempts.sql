-- Checkout Pro can create several payment attempts for one preference. A card
-- rejection is not the end of the reservation or permission to pay elsewhere.
create or replace function public.site_payment_reconcile(p_id uuid,p_provider text,p_status text,p_updated timestamptz,p_pix_code text,p_pix_qr text) returns void
language plpgsql security invoker set search_path = '' as $$
declare o public.site_payment_orders%rowtype;
begin
  select * into o from public.site_payment_orders where id=p_id for update;
  if not found then raise exception 'CHECKOUT: Pedido não encontrado.'; end if;
  if p_status not in ('pending','in_process','authorized','approved','rejected','cancelled','refunded','charged_back') then
    raise exception 'CHECKOUT: Status inválido.';
  end if;
  if o.checkout_started_at is not null and p_status in ('rejected','cancelled') then
    if o.provider_id is not null and o.provider_id<>p_provider then return; end if;
    if o.provider_updated_at is not null and p_updated<o.provider_updated_at then return; end if;
    if o.status in ('approved','refunded','charged_back') then return; end if;
    update public.site_payment_orders set status='prepared',provider_id=null,provider_updated_at=null,
      pix_code=null,pix_qr=null,updated_at=now() where id=p_id;
    update public.site_payment_order_items set active=true where order_id=p_id;
    update public.inscritos set pagamento_status='pendente',pagamento_id=null,pagamento_atualizado_em=now()
      where pagamento_pedido_id=p_id and id in (select inscrito_id from public.site_payment_order_items where order_id=p_id);
    return;
  end if;
  if o.provider_id is not null and o.provider_id<>p_provider then raise exception 'CHECKOUT: Pagamento divergente.'; end if;
  if o.provider_updated_at is not null and p_updated<o.provider_updated_at then return; end if;
  if o.status in ('refunded','charged_back') and p_status not in ('refunded','charged_back') then return; end if;
  if o.status='approved' and p_status not in ('approved','refunded','charged_back') then return; end if;
  update public.site_payment_orders set provider_id=p_provider,status=p_status,provider_updated_at=p_updated,provider_request=null,
    pix_code=case when p_status='pending' then p_pix_code else null end,
    pix_qr=case when p_status='pending' then p_pix_qr else null end,updated_at=now() where id=p_id;
  update public.site_payment_order_items set active=p_status not in ('rejected','cancelled','refunded','charged_back') where order_id=p_id;
  update public.inscritos set pagamento_status=case when p_status='approved' then 'pago'
      when p_status in ('refunded','charged_back') then 'estornado' else 'pendente' end,
    pagamento_id=p_provider,pagamento_origem='mercado_pago',pagamento_atualizado_em=now()
    where pagamento_pedido_id=p_id and id in (select inscrito_id from public.site_payment_order_items where order_id=p_id);
end $$;
