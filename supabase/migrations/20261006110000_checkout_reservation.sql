-- Once a Checkout Pro link can exist, keep its registrations reserved until
-- the provider has confirmed an outcome. A link remains payable for 24 hours.
alter table public.site_payment_orders add column checkout_started_at timestamptz;

-- Existing prepared orders may already have a live preference. Be conservative.
update public.site_payment_orders set checkout_started_at = created_at where status = 'prepared';

create function public.site_payment_checkout_start(p_id uuid, p_hash text) returns void
language plpgsql security invoker set search_path = '' as $$
declare o public.site_payment_orders%rowtype;
begin
  select * into o from public.site_payment_orders where id=p_id for update;
  if not found or o.access_hash<>p_hash or o.status<>'prepared' or o.provider_id is not null then
    raise exception 'CHECKOUT: Pedido indisponível.';
  end if;
  if o.checkout_started_at is null and o.created_at<now()-interval '15 minutes' then
    raise exception 'CHECKOUT: Sessão expirada. Inicie um novo pagamento.';
  end if;
  update public.site_payment_orders set checkout_started_at=coalesce(checkout_started_at,now()) where id=p_id;
end $$;

create or replace function public.site_payment_prepare(p_id uuid,p_hash text,p_category text,p_people jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  existing public.site_payment_orders%rowtype;
  registration public.inscritos%rowtype;
  ids uuid[] := '{}';
  person jsonb;
  qty integer;
  unit integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,2));
  select * into existing from public.site_payment_orders where id=p_id for update;
  if found then
    if existing.access_hash <> p_hash or existing.categoria <> p_category then raise exception 'CHECKOUT: Sessão inválida.'; end if;
    return;
  end if;
  if p_category not in ('participante','equipe') or jsonb_typeof(p_people) <> 'array' then raise exception 'CHECKOUT: Categoria ou inscrições inválidas.'; end if;
  qty := jsonb_array_length(p_people);
  if qty < 1 or qty > 20 or (select count(distinct value->>'cpf') from jsonb_array_elements(p_people)) <> qty then raise exception 'CHECKOUT: Selecione de 1 a 20 inscrições diferentes.'; end if;
  -- An issued preference must never be released merely because 15 minutes passed.
  with expired as (
    update public.site_payment_orders set status='expired',updated_at=now()
    where status='prepared' and checkout_started_at is null and created_at<now()-interval '15 minutes' returning id
  ) update public.site_payment_order_items set active=false where order_id in (select id from expired);
  for person in select value from jsonb_array_elements(p_people) loop
    select * into registration from public.inscritos
    where regexp_replace(cpf,'[^0-9]','','g')=person->>'cpf' and lower(trim(email))=person->>'email' and categoria=p_category;
    if not found then raise exception 'CHECKOUT: Confira CPF, e-mail e categoria de cada ficha. Todas as pessoas precisam estar inscritas.'; end if;
    ids := array_append(ids,registration.id);
  end loop;
  perform id from public.inscritos where id=any(ids) order by id for update;
  if exists(select 1 from public.inscritos where id=any(ids) and pagamento_status in ('pago','approved','cancelado')) or
     exists(select 1 from public.site_payment_order_items where inscrito_id=any(ids) and active) then
    raise exception 'CHECKOUT: Uma inscrição já está paga, cancelada ou tem um pagamento em andamento. Consulte o pagamento anterior ou fale com a organização.';
  end if;
  unit := case p_category when 'equipe' then 9000 else 18000 end;
  insert into public.site_payment_orders(id,access_hash,categoria,quantity,unit_cents,total_cents) values(p_id,p_hash,p_category,qty,unit,unit*qty);
  insert into public.site_payment_order_items(order_id,inscrito_id) select p_id,unnest(ids);
  update public.inscritos set pagamento_pedido_id=p_id where id=any(ids);
end $$;

create or replace function public.site_payment_abandon(p_id uuid,p_hash text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  update public.site_payment_orders set status='expired',updated_at=now()
    where id=p_id and access_hash=p_hash and status='prepared' and checkout_started_at is null;
  if not found then raise exception 'CHECKOUT: Este checkout já foi aberto. Consulte o pagamento antes de alterar inscrições.'; end if;
  update public.site_payment_order_items set active=false where order_id=p_id;
end $$;

revoke all on function public.site_payment_checkout_start(uuid,text) from public,anon,authenticated;
grant execute on function public.site_payment_checkout_start(uuid,text) to service_role;
