-- ════════════════════════════════════════════════════════════════════
-- "Our Little Universe" (template `lovestory`): recipient responses.
-- Additive only. The story content itself lives in sites.draft_content / site_versions like
-- every template (validated JSON snapshots); responses are separate rows because they are
-- written by the recipient, have their own lifecycle (owner can clear them) and are queried
-- independently of the published snapshot.
--
-- Written only by server code (service role) after it has checked that the site is published,
-- unlocked, has response collection switched on, and that the item exists in the published
-- content. The owner reads them through RLS; nobody else can.
-- ════════════════════════════════════════════════════════════════════

create table public.site_responses (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites (id) on delete cascade,
  kind        text not null check (kind in ('text', 'slider', 'coupon')),
  item_id     text not null check (item_id ~ '^[a-z0-9]{4,16}$'),
  -- Snapshot of the question/coupon title taken server-side from the published content.
  label       text not null default '' check (char_length(label) <= 160),
  value       text not null check (char_length(value) <= 1000),
  created_at  timestamptz not null default now()
);
create index site_responses_site_idx on public.site_responses (site_id, created_at desc);

revoke all on public.site_responses from anon, authenticated;
grant select on public.site_responses to authenticated;
grant all on public.site_responses to service_role;

alter table public.site_responses enable row level security;

-- Owner only (like the other content tables, admins can't read these through the API).
create policy site_responses_select on public.site_responses for select to authenticated
  using (exists (select 1 from public.sites s where s.id = site_responses.site_id and s.user_id = (select auth.uid()) and s.status <> 'deleted'));
