-- Final cutover: legacy registration documents become private and are served only
-- through opaque, high-entropy registration-file tokens.

create index if not exists registration_file_tokens_registration_id_idx
  on public.registration_file_tokens (registration_id);

-- Refuse the cutover if a legacy URL points to an object that no longer exists.
do $$
declare
  missing_count integer;
begin
  with refs as (
    select 'fotos'::text as bucket_id,
           split_part(foto_url, '/storage/v1/object/public/fotos/', 2) as object_name
    from public.inscritos
    where coalesce(foto_url, '') like '%/storage/v1/object/public/fotos/%'
    union all
    select 'comprovantes',
           split_part(comprovante_url, '/storage/v1/object/public/comprovantes/', 2)
    from public.inscritos
    where coalesce(comprovante_url, '') like '%/storage/v1/object/public/comprovantes/%'
    union all
    select 'autorizacoes',
           split_part(autorizacao_menor_url, '/storage/v1/object/public/autorizacoes/', 2)
    from public.inscritos
    where coalesce(autorizacao_menor_url, '') like '%/storage/v1/object/public/autorizacoes/%'
  )
  select count(*) into missing_count
  from refs r
  left join storage.objects o
    on o.bucket_id = r.bucket_id and o.name = r.object_name
  where o.id is null;

  if missing_count > 0 then
    raise exception 'Private-file cutover aborted: % referenced object(s) are missing.', missing_count;
  end if;
end
$$;

-- Tokenize all legacy photo URLs that are still public.
insert into public.registration_file_tokens (
  token, registration_id, bucket_id, object_name, file_kind
)
select
  encode(gen_random_bytes(32), 'hex'),
  i.id,
  'fotos',
  split_part(i.foto_url, '/storage/v1/object/public/fotos/', 2),
  'foto'
from public.inscritos i
where coalesce(i.foto_url, '') like '%/storage/v1/object/public/fotos/%';

insert into public.registration_file_tokens (
  token, registration_id, bucket_id, object_name, file_kind
)
select
  encode(gen_random_bytes(32), 'hex'),
  i.id,
  'comprovantes',
  split_part(i.comprovante_url, '/storage/v1/object/public/comprovantes/', 2),
  'comprovante'
from public.inscritos i
where coalesce(i.comprovante_url, '') like '%/storage/v1/object/public/comprovantes/%';

insert into public.registration_file_tokens (
  token, registration_id, bucket_id, object_name, file_kind
)
select
  encode(gen_random_bytes(32), 'hex'),
  i.id,
  'autorizacoes',
  split_part(i.autorizacao_menor_url, '/storage/v1/object/public/autorizacoes/', 2),
  'autorizacao'
from public.inscritos i
where coalesce(i.autorizacao_menor_url, '') like '%/storage/v1/object/public/autorizacoes/%';

update public.inscritos i
set foto_url = 'https://oxdskhrbfslrjakutoye.supabase.co/functions/v1/registration-file?token=' || t.token
from public.registration_file_tokens t
where t.registration_id = i.id
  and t.file_kind = 'foto'
  and coalesce(i.foto_url, '') like '%/storage/v1/object/public/fotos/%';

update public.inscritos i
set comprovante_url = 'https://oxdskhrbfslrjakutoye.supabase.co/functions/v1/registration-file?token=' || t.token
from public.registration_file_tokens t
where t.registration_id = i.id
  and t.file_kind = 'comprovante'
  and coalesce(i.comprovante_url, '') like '%/storage/v1/object/public/comprovantes/%';

update public.inscritos i
set autorizacao_menor_url = 'https://oxdskhrbfslrjakutoye.supabase.co/functions/v1/registration-file?token=' || t.token
from public.registration_file_tokens t
where t.registration_id = i.id
  and t.file_kind = 'autorizacao'
  and coalesce(i.autorizacao_menor_url, '') like '%/storage/v1/object/public/autorizacoes/%';

-- Make all sensitive registration buckets private. Service-role Edge Functions keep
-- working; browser clients no longer read or upload directly.
update storage.buckets
set public = false
where id in ('fotos', 'comprovantes', 'autorizacoes');

drop policy if exists "Permitir leitura publica de autorizacoes" on storage.objects;
drop policy if exists "Permitir leitura publica de comprovantes" on storage.objects;
drop policy if exists "Permitir leitura publica de fotos" on storage.objects;
drop policy if exists "Permitir upload publico de autorizacoes" on storage.objects;
drop policy if exists "Permitir upload publico de comprovantes" on storage.objects;
drop policy if exists "Permitir upload publico de fotos" on storage.objects;

-- The public form now writes exclusively through submit-registration (service role).
drop policy if exists public_insert_inscritos on public.inscritos;
revoke insert on table public.inscritos from anon;
revoke insert on table public.inscritos from authenticated;

-- Defensive assertion: no database record may retain a public Storage URL.
do $$
begin
  if exists (
    select 1
    from public.inscritos
    where coalesce(foto_url, '') like '%/storage/v1/object/public/%'
       or coalesce(comprovante_url, '') like '%/storage/v1/object/public/%'
       or coalesce(autorizacao_menor_url, '') like '%/storage/v1/object/public/%'
  ) then
    raise exception 'Private-file cutover aborted: legacy public URLs remain.';
  end if;
end
$$;
