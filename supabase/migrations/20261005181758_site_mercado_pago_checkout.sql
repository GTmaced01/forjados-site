-- Fixed server prices, atomic reservations and provider-confirmed registration status.
alter table public.inscritos
  add column categoria text not null default 'participante' check (categoria in ('participante','equipe')),
  add column pagamento_pedido_id uuid,
  add column pagamento_id text,
  add column pagamento_origem text,
  add column pagamento_atualizado_em timestamptz;

-- Existing data was checked for duplicates before adding these constraints.
create unique index inscritos_cpf_normalizado_key on public.inscritos ((regexp_replace(cpf,'[^0-9]','','g')));
create unique index inscritos_email_normalizado_key on public.inscritos ((lower(trim(email))));

create table public.site_payment_orders (
  id uuid primary key,
  access_hash text not null check (access_hash ~ '^[a-f0-9]{64}$'),
  categoria text not null check (categoria in ('participante','equipe')),
  quantity integer not null check (quantity between 1 and 20),
  unit_cents integer not null,
  total_cents integer not null,
  status text not null default 'prepared' check (status in ('prepared','submitting','pending','in_process','authorized','approved','rejected','cancelled','refunded','charged_back','failed','expired')),
  provider_id text unique,
  provider_updated_at timestamptz,
  provider_request jsonb,
  pix_code text,
  pix_qr text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (unit_cents = case categoria when 'equipe' then 9000 else 18000 end),
  check (total_cents = unit_cents * quantity)
);
create table public.site_payment_order_items (
  order_id uuid not null references public.site_payment_orders(id),
  inscrito_id uuid not null references public.inscritos(id),
  active boolean not null default true,
  primary key (order_id,inscrito_id)
);
create unique index site_payment_one_active_order on public.site_payment_order_items(inscrito_id) where active;
create index site_payment_items_registration on public.site_payment_order_items(inscrito_id);
create table public.site_payment_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index site_payment_attempts_lookup on public.site_payment_attempts(ip_hash,created_at);
alter table public.site_payment_orders enable row level security;
alter table public.site_payment_order_items enable row level security;
alter table public.site_payment_attempts enable row level security;
revoke all on public.site_payment_orders,public.site_payment_order_items,public.site_payment_attempts from anon,authenticated;
grant all on public.site_payment_orders,public.site_payment_order_items,public.site_payment_attempts to service_role;
grant usage,select on sequence public.site_payment_attempts_id_seq to service_role;

create function public.site_payment_rate_limit(p_hash text) returns boolean
language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_hash,1));
  delete from public.site_payment_attempts where created_at < now() - interval '24 hours';
  if (select count(*) from public.site_payment_attempts where ip_hash=p_hash and created_at > now()-interval '1 hour') >= 20 then return false; end if;
  insert into public.site_payment_attempts(ip_hash) values(p_hash);
  return true;
end $$;

create function public.site_payment_prepare(p_id uuid,p_hash text,p_category text,p_people jsonb) returns void
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
  -- Only unsubmitted sessions can expire locally. Submitted payments remain locked.
  with expired as (
    update public.site_payment_orders set status='expired',updated_at=now()
    where status='prepared' and created_at<now()-interval '15 minutes' returning id
  ) update public.site_payment_order_items set active=false where order_id in (select id from expired);
  for person in select value from jsonb_array_elements(p_people) loop
    select * into registration from public.inscritos
    where regexp_replace(cpf,'[^0-9]','','g')=person->>'cpf' and lower(trim(email))=person->>'email' and categoria=p_category;
    if not found then raise exception 'CHECKOUT: Confira CPF, e-mail e categoria de cada ficha. Todas as pessoas precisam estar inscritas.'; end if;
    ids := array_append(ids,registration.id);
  end loop;
  -- Deterministic locking prevents two different buyers paying the same registration.
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

create function public.site_payment_begin(p_id uuid,p_hash text,p_request jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare o public.site_payment_orders%rowtype;
begin
  select * into o from public.site_payment_orders where id=p_id for update;
  if not found or o.access_hash<>p_hash then raise exception 'CHECKOUT: Sessão inválida.'; end if;
  if o.status='submitting' then return o.provider_request; end if;
  if o.status<>'prepared' then return null; end if;
  if o.created_at<now()-interval '15 minutes' then raise exception 'CHECKOUT: Sessão expirada. Inicie um novo pagamento.'; end if;
  if (p_request->>'transaction_amount')::numeric * 100 <> o.total_cents or p_request->>'external_reference'<>p_id::text or
    (p_request->>'installments')::integer not between 1 and 3 then raise exception 'CHECKOUT: Valor ou parcelamento inválido.'; end if;
  update public.site_payment_orders set status='submitting',provider_request=p_request,updated_at=now() where id=p_id;
  return p_request;
end $$;

create function public.site_payment_fail(p_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  update public.site_payment_orders set status='failed',provider_request=null,updated_at=now() where id=p_id and status='submitting' and provider_id is null;
  if found then update public.site_payment_order_items set active=false where order_id=p_id; end if;
end $$;

create function public.site_payment_abandon(p_id uuid,p_hash text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  update public.site_payment_orders set status='expired',updated_at=now()
    where id=p_id and access_hash=p_hash and status='prepared';
  if found then update public.site_payment_order_items set active=false where order_id=p_id; end if;
end $$;

create function public.site_payment_reconcile(p_id uuid,p_provider text,p_status text,p_updated timestamptz,p_pix_code text,p_pix_qr text) returns void
language plpgsql security invoker set search_path = '' as $$
declare o public.site_payment_orders%rowtype;
begin
  select * into o from public.site_payment_orders where id=p_id for update;
  if not found then raise exception 'CHECKOUT: Pedido não encontrado.'; end if;
  if o.provider_id is not null and o.provider_id<>p_provider then raise exception 'CHECKOUT: Pagamento divergente.'; end if;
  if o.provider_updated_at is not null and p_updated < o.provider_updated_at then return; end if;
  if o.status in ('refunded','charged_back') and p_status not in ('refunded','charged_back') then return; end if;
  if o.status='approved' and p_status not in ('approved','refunded','charged_back') then return; end if;
  if p_status not in ('pending','in_process','authorized','approved','rejected','cancelled','refunded','charged_back') then raise exception 'CHECKOUT: Status inválido.'; end if;
  update public.site_payment_orders set provider_id=p_provider,status=p_status,provider_updated_at=p_updated,provider_request=null,
    pix_code=case when p_status='pending' then p_pix_code else null end,pix_qr=case when p_status='pending' then p_pix_qr else null end,updated_at=now() where id=p_id;
  update public.site_payment_order_items set active=p_status not in ('rejected','cancelled','refunded','charged_back') where order_id=p_id;
  update public.inscritos set pagamento_status=case when p_status='approved' then 'pago' when p_status in ('refunded','charged_back') then 'estornado' else 'pendente' end,
    pagamento_id=p_provider,pagamento_origem='mercado_pago',pagamento_atualizado_em=now()
    where pagamento_pedido_id=p_id and id in (select inscrito_id from public.site_payment_order_items where order_id=p_id);
end $$;

revoke all on function public.site_payment_rate_limit(text),public.site_payment_prepare(uuid,text,text,jsonb),public.site_payment_begin(uuid,text,jsonb),public.site_payment_fail(uuid),public.site_payment_abandon(uuid,text),public.site_payment_reconcile(uuid,text,text,timestamptz,text,text) from public,anon,authenticated;
grant execute on function public.site_payment_rate_limit(text),public.site_payment_prepare(uuid,text,text,jsonb),public.site_payment_begin(uuid,text,jsonb),public.site_payment_fail(uuid),public.site_payment_abandon(uuid,text),public.site_payment_reconcile(uuid,text,text,timestamptz,text,text) to service_role;
