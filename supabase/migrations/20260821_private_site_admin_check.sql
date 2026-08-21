create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.site_admins a
    where a.user_id = auth.uid()
  );
$$;

revoke all on function private.is_site_admin() from public;
grant execute on function private.is_site_admin() to authenticated;

alter policy site_admin_select_inscritos on public.inscritos
  using ((select private.is_site_admin()));

alter policy site_admin_update_inscritos on public.inscritos
  using ((select private.is_site_admin()))
  with check ((select private.is_site_admin()));

drop function if exists public.is_site_admin();
