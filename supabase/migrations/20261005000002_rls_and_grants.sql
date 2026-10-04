-- ════════════════════════════════════════════════════════════════════
-- Grants + Row Level Security. Deny by default; grant the minimum.
-- ════════════════════════════════════════════════════════════════════

-- Start from nothing for the API roles.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- is_admin() is evaluated inside policies for the authenticated role.
grant execute on function public.is_admin() to authenticated;

-- Read-only access for signed-in users (rows filtered by the policies below).
grant select on public.profiles, public.sites, public.site_versions, public.assets,
                public.orders, public.payments to authenticated;
-- Admin-only tables: the grant exists so the policy can admit MFA'd admins; customers get 0 rows.
grant select on public.payment_events, public.audit_log, public.abuse_reports,
                public.template_versions to authenticated;
-- Public catalog.
grant select on public.templates, public.products to anon, authenticated;

alter table public.profiles          enable row level security;
alter table public.templates         enable row level security;
alter table public.template_versions enable row level security;
alter table public.products          enable row level security;
alter table public.orders            enable row level security;
alter table public.payments          enable row level security;
alter table public.payment_events    enable row level security;
alter table public.sites             enable row level security;
alter table public.site_versions     enable row level security;
alter table public.assets            enable row level security;
alter table public.audit_log         enable row level security;
alter table public.abuse_reports     enable row level security;
alter table public.rate_limits       enable row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy templates_select on public.templates for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy template_versions_select on public.template_versions for select to authenticated
  using ((select public.is_admin()));

create policy products_select on public.products for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy orders_select on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy payments_select on public.payments for select to authenticated
  using (
    exists (select 1 from public.orders o where o.id = payments.order_id and o.user_id = (select auth.uid()))
    or (select public.is_admin())
  );

create policy payment_events_select on public.payment_events for select to authenticated
  using ((select public.is_admin()));

create policy sites_select on public.sites for select to authenticated
  using ((user_id = (select auth.uid()) and status <> 'deleted') or (select public.is_admin()));

create policy site_versions_select on public.site_versions for select to authenticated
  using (
    exists (select 1 from public.sites s where s.id = site_versions.site_id and s.user_id = (select auth.uid()) and s.status <> 'deleted')
    or (select public.is_admin())
  );

create policy assets_select on public.assets for select to authenticated
  using ((user_id = (select auth.uid()) and status <> 'deleted') or (select public.is_admin()));

create policy audit_log_select on public.audit_log for select to authenticated
  using ((select public.is_admin()));

create policy abuse_reports_select on public.abuse_reports for select to authenticated
  using ((select public.is_admin()));

-- rate_limits: no policies → no access for anon/authenticated.

-- ───────── storage: one private bucket, no client policies ─────────
-- Objects are only reachable through short-lived signed URLs minted by the server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', false, 15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac', 'audio/x-aac']
)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
