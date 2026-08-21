-- Security hardening applied to FORJADOS Site production on 2026-08-21.

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;
revoke all on table public.site_admins from public, anon, authenticated;

-- One-time bootstrap for an existing installation. New installations should add the
-- intended administrator explicitly after creating the Auth user.
insert into public.site_admins (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.site_admins a
    where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_site_admin() from public, anon;
grant execute on function public.is_site_admin() to authenticated, service_role;

drop policy if exists "Permitir atualizacao para admins autenticados" on public.inscritos;
drop policy if exists "Permitir leitura para admins autenticados" on public.inscritos;
drop policy if exists "Permitir inscricoes publicas" on public.inscritos;
drop policy if exists site_admin_select_inscritos on public.inscritos;
drop policy if exists site_admin_update_inscritos on public.inscritos;
drop policy if exists public_insert_inscritos on public.inscritos;

create policy site_admin_select_inscritos
on public.inscritos
for select
to authenticated
using ((select public.is_site_admin()));

create policy site_admin_update_inscritos
on public.inscritos
for update
to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

-- Transitional policy. Removed by the final storage lockdown migration after
-- the Edge registration gateway is live in the frontend.
create policy public_insert_inscritos
on public.inscritos
for insert
to anon
with check (
  coalesce(pagamento_status, 'pendente') = 'pendente'
  and coalesce(observacao_admin, '') = ''
  and coalesce(aceitou_termo, false) = true
  and coalesce(aceitou_politica, false) = true
);

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']::text[]
where id = 'fotos';

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf']::text[]
where id in ('comprovantes','autorizacoes');

create table if not exists public.site_runtime_secrets (
  secret_name text primary key,
  secret_value text not null,
  created_at timestamptz not null default now(),
  rotated_at timestamptz not null default now()
);

alter table public.site_runtime_secrets enable row level security;
revoke all on table public.site_runtime_secrets from public, anon, authenticated;
grant select on table public.site_runtime_secrets to service_role;

insert into public.site_runtime_secrets (secret_name, secret_value)
select
  'registration_webhook',
  replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
where not exists (
  select 1 from public.site_runtime_secrets where secret_name = 'registration_webhook'
);

create or replace function public.forjados_notify_new_inscrito()
returns trigger
language plpgsql
security definer
set search_path = public, net
as $$
declare
  request_id bigint;
  payload jsonb;
  webhook_secret text;
begin
  select secret_value
  into webhook_secret
  from public.site_runtime_secrets
  where secret_name = 'registration_webhook';

  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', jsonb_build_object(
      'id', NEW.id,
      'nome', NEW.nome,
      'email', NEW.email,
      'telefone', NEW.telefone,
      'pagamento_status', NEW.pagamento_status,
      'created_at', NEW.created_at
    ),
    'old_record', null
  );

  select net.http_post(
    url := 'https://medeiros-server.taileb306c.ts.net/webhook/forjados-nova-inscricao',
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-forjados-webhook-secret', webhook_secret
    ),
    timeout_milliseconds := 5000
  )
  into request_id;

  return NEW;
end;
$$;

revoke execute on function public.forjados_notify_new_inscrito() from public, anon, authenticated;

create table if not exists public.registration_file_tokens (
  token text primary key,
  registration_id uuid references public.inscritos(id) on delete cascade,
  bucket_id text not null,
  object_name text not null,
  file_kind text not null check (file_kind in ('foto','comprovante','autorizacao')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.registration_file_tokens enable row level security;
revoke all on table public.registration_file_tokens from public, anon, authenticated;
grant select, insert, update, delete on table public.registration_file_tokens to service_role;

create unique index if not exists registration_file_tokens_object_uidx
  on public.registration_file_tokens(bucket_id, object_name);

create table if not exists public.registration_submission_attempts (
  id bigint generated by default as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.registration_submission_attempts enable row level security;
revoke all on table public.registration_submission_attempts from public, anon, authenticated;
grant select, insert, delete on table public.registration_submission_attempts to service_role;

create index if not exists registration_submission_attempts_ip_created_idx
  on public.registration_submission_attempts(ip_hash, created_at desc);

grant usage, select on sequence public.registration_submission_attempts_id_seq to service_role;
grant select, insert, update, delete on table public.inscritos to service_role;
