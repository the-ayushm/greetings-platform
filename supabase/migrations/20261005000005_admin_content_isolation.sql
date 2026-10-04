-- Customer content (draft/published text, files) is readable by its owner only — not even by
-- admins through the data API. Admin tooling reads site *metadata* server-side, and content
-- only through the audited "view content" endpoint.
drop policy if exists sites_select on public.sites;
create policy sites_select on public.sites for select to authenticated
  using (user_id = (select auth.uid()) and status <> 'deleted');

drop policy if exists site_versions_select on public.site_versions;
create policy site_versions_select on public.site_versions for select to authenticated
  using (exists (select 1 from public.sites s where s.id = site_versions.site_id and s.user_id = (select auth.uid()) and s.status <> 'deleted'));

drop policy if exists assets_select on public.assets;
create policy assets_select on public.assets for select to authenticated
  using (user_id = (select auth.uid()) and status <> 'deleted');
