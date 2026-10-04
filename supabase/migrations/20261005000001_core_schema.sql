-- ════════════════════════════════════════════════════════════════════
-- Core schema: identity, catalog, orders/payments, sites, assets, ops.
-- Access model:
--   * anon:          nothing except the active catalog (templates/products).
--   * authenticated: SELECT on own rows only (RLS). No INSERT/UPDATE/DELETE grants at all —
--                    every write goes through server code that re-checks ownership.
--   * admin:         SELECT on everything, but only with a role=admin profile AND an MFA
--                    (aal2) session. Admin writes also go through audited server code.
--   * service_role:  server only (webhooks, renderer lookup, signed URLs, admin actions).
-- ════════════════════════════════════════════════════════════════════

set check_function_bodies = off;

-- ───────── identity ─────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null default '',
  full_name   text not null default '' check (char_length(full_name) <= 80),
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, ''), updated_at = now() where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Admin = admin role AND a multi-factor (aal2) session. Used by RLS policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
     and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- ───────── catalog ─────────
create table public.templates (
  key          text primary key check (key ~ '^[a-z0-9-]{2,40}$'),
  name         text not null check (char_length(name) between 1 and 80),
  description  text not null default '' check (char_length(description) <= 500),
  is_active    boolean not null default true,
  sort         int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.template_versions (
  template_key     text not null references public.templates (key) on delete restrict,
  version          int not null check (version > 0),
  schema_version   int not null check (schema_version > 0),
  default_content  jsonb not null,
  is_current       boolean not null default false,
  notes            text not null default '',
  released_at      timestamptz not null default now(),
  primary key (template_key, version)
);
create unique index template_versions_one_current on public.template_versions (template_key) where is_current;

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  template_key  text not null references public.templates (key) on delete restrict,
  name          text not null check (char_length(name) between 1 and 80),
  description   text not null default '' check (char_length(description) <= 500),
  price_paise   int not null check (price_paise between 100 and 10000000),
  currency      text not null default 'INR' check (currency = 'INR'),
  edit_days     int not null default 30 check (edit_days between 1 and 365),
  live_days     int not null default 365 check (live_days between 1 and 3650),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ───────── orders & payments ─────────
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  -- set null on account deletion: the financial record stays (tax/accounting), the person does not.
  user_id             uuid references public.profiles (id) on delete set null,
  product_id          uuid not null references public.products (id) on delete restrict,
  template_key        text not null,
  template_version    int not null,
  amount_paise        int not null check (amount_paise > 0),
  currency            text not null check (currency = 'INR'),
  edit_days           int not null,
  live_days           int not null,
  status              text not null default 'created'
                      check (status in ('created', 'paid', 'refund_pending', 'refunded', 'expired')),
  receipt             text not null unique,
  razorpay_order_id   text unique,
  last_payment_error  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  paid_at             timestamptz,
  refunded_at         timestamptz
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at);

create table public.payments (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid not null references public.orders (id) on delete cascade,
  razorpay_payment_id  text not null unique,
  amount_paise         int not null,
  currency             text not null,
  status               text not null check (status in ('authorized', 'captured', 'failed', 'refunded')),
  method               text,
  error_code           text,
  error_description    text,
  is_duplicate         boolean not null default false,
  refund_status        text check (refund_status in ('pending', 'processed', 'failed')),
  razorpay_refund_id   text unique,
  refunded_paise       int not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);

-- Webhook inbox. `summary` holds only the ids/amounts/status we need — never the customer's
-- email/phone/card details that Razorpay includes in raw payloads.
create table public.payment_events (
  id                   uuid primary key default gen_random_uuid(),
  event_id             text not null unique,
  event_type           text not null,
  razorpay_order_id    text,
  razorpay_payment_id  text,
  razorpay_refund_id   text,
  summary              jsonb not null default '{}',
  received_at          timestamptz not null default now(),
  processed_at         timestamptz,
  attempts             int not null default 0,
  error                text
);
create index payment_events_unprocessed_idx on public.payment_events (received_at) where processed_at is null;

-- ───────── sites ─────────
create table public.sites (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles (id) on delete cascade,
  order_id              uuid not null unique references public.orders (id) on delete restrict,
  template_key          text not null,
  template_version      int not null,
  status                text not null default 'draft'
                        check (status in ('draft', 'published', 'unpublished', 'disabled', 'expired', 'deleted')),
  -- 22 base62 chars ≈ 131 bits from a CSPRNG. Never derived from names or ids.
  slug                  text unique check (slug ~ '^[A-Za-z0-9]{22}$'),
  passcode_hash         text,
  passcode_version      int not null default 0,
  draft_content         jsonb not null check (pg_column_size(draft_content) < 262144),
  draft_revision        int not null default 1,
  published_version_id  uuid,
  published_at          timestamptz,
  edit_until            timestamptz not null,
  expires_at            timestamptz not null,
  disabled_reason       text,
  first_viewed_at       timestamptz,
  view_count            int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);
create index sites_user_idx on public.sites (user_id, created_at desc);
create index sites_expiry_idx on public.sites (expires_at) where status not in ('deleted', 'expired');

create table public.site_versions (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites (id) on delete cascade,
  version         int not null,
  content         jsonb not null check (pg_column_size(content) < 262144),
  schema_version  int not null,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  unique (site_id, version)
);

alter table public.sites
  add constraint sites_published_version_fk
  foreign key (published_version_id) references public.site_versions (id) on delete set null;

-- ───────── assets ─────────
create table public.assets (
  id                   uuid primary key default gen_random_uuid(),
  site_id              uuid not null references public.sites (id) on delete cascade,
  user_id              uuid not null references public.profiles (id) on delete cascade,
  kind                 text not null check (kind in ('image', 'audio')),
  status               text not null default 'pending' check (status in ('pending', 'ready', 'rejected', 'deleted')),
  original_name        text not null default '' check (char_length(original_name) <= 120),
  declared_mime        text not null,
  declared_bytes       bigint not null check (declared_bytes > 0),
  mime                 text,
  bytes                bigint,
  width                int,
  height               int,
  duration_s           numeric(8, 2),
  -- Paths are "<asset id>/<variant>": no user or site ids appear in signed URLs.
  storage_prefix       text not null,
  variants             jsonb not null default '{}',
  sha256               text,
  rejection_reason     text,
  rights_confirmed_at  timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index assets_site_idx on public.assets (site_id, kind, status);
create index assets_pending_idx on public.assets (created_at) where status = 'pending';

-- An asset can only ever belong to the owner of its site.
create or replace function public.assets_owner_matches_site()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.sites s where s.id = new.site_id and s.user_id = new.user_id) then
    raise exception 'asset owner does not match site owner' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger assets_owner_check before insert or update of site_id, user_id on public.assets
  for each row execute function public.assets_owner_matches_site();

-- ───────── operations ─────────
create table public.audit_log (
  id          bigserial primary key,
  actor_id    uuid,
  actor_role  text not null default 'system' check (actor_role in ('customer', 'admin', 'system', 'webhook')),
  action      text not null,
  target_type text,
  target_id   text,
  meta        jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index audit_log_target_idx on public.audit_log (target_type, target_id, created_at desc);
create index audit_log_created_idx on public.audit_log (created_at desc);

create table public.abuse_reports (
  id               uuid primary key default gen_random_uuid(),
  site_id          uuid references public.sites (id) on delete set null,
  reason           text not null check (reason in ('harassment', 'explicit', 'copyright', 'impersonation', 'other')),
  details          text not null default '' check (char_length(details) <= 1000),
  reporter_hash    text,
  status           text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  resolved_by      uuid,
  resolved_at      timestamptz,
  resolution_note  text,
  created_at       timestamptz not null default now()
);
create index abuse_reports_status_idx on public.abuse_reports (status, created_at desc);

-- Fixed-window rate limiting shared by every serverless instance.
create table public.rate_limits (
  key           text not null,
  window_start  timestamptz not null,
  count         int not null default 0,
  primary key (key, window_start)
);

create or replace function public.rate_limit_hit(p_key text, p_window_seconds int, p_max int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n int;
begin
  insert into public.rate_limits (key, window_start, count) values (p_key, w, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count into n;
  return n <= p_max;
end;
$$;

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger templates_touch before update on public.templates for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();
create trigger payments_touch before update on public.payments for each row execute function public.touch_updated_at();
create trigger sites_touch before update on public.sites for each row execute function public.touch_updated_at();
create trigger assets_touch before update on public.assets for each row execute function public.touch_updated_at();
