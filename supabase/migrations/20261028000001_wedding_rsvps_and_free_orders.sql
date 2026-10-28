-- ════════════════════════════════════════════════════════════════════
-- "Royal Burgundy" wedding invitation (template `wedding`). Additive only — no data is changed
-- or removed:
--   1. ₹0 products/orders, so a product can be tested (or given away) without a payment.
--      Paid prices keep their old range; Razorpay is never called for a ₹0 order.
--   2. site_rsvps: guests' replies to a published invitation (owner-only reads, server writes).
--   3. fulfil_free_order(): the ₹0 counterpart of fulfil_order() — one order, one site.
-- ════════════════════════════════════════════════════════════════════

-- ───────── 1. free products / orders ─────────
alter table public.products drop constraint if exists products_price_paise_check;
alter table public.products add constraint products_price_paise_check
  check (price_paise = 0 or price_paise between 100 and 10000000);

alter table public.orders drop constraint if exists orders_amount_paise_check;
alter table public.orders add constraint orders_amount_paise_check check (amount_paise >= 0);

-- ───────── 2. RSVPs ─────────
-- Written only by server code (service role) after it has checked that the invitation is
-- published, unlocked, has RSVPs switched on and is still taking replies, and validated the
-- reply against the PUBLISHED content (guest limit, message on/off).
create table public.site_rsvps (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites (id) on delete cascade,
  guest_name  text not null check (char_length(guest_name) between 1 and 80),
  -- Normalised name ("priya sharma"): one reply per guest name per invitation.
  name_key    text not null check (char_length(name_key) between 1 and 80),
  attending   boolean not null,
  guests      int not null check (guests between 0 and 20),
  message     text not null default '' check (char_length(message) <= 500),
  created_at  timestamptz not null default now(),
  check (attending or guests = 0),
  unique (site_id, name_key)
);
create index site_rsvps_site_idx on public.site_rsvps (site_id, created_at desc);

revoke all on public.site_rsvps from anon, authenticated;
grant select on public.site_rsvps to authenticated;
grant all on public.site_rsvps to service_role;

alter table public.site_rsvps enable row level security;

-- Owner only (like the other content tables, admins can't read these through the API).
create policy site_rsvps_select on public.site_rsvps for select to authenticated
  using (exists (select 1 from public.sites s where s.id = site_rsvps.site_id and s.user_id = (select auth.uid()) and s.status <> 'deleted'));

-- ───────── 3. free fulfilment ─────────
-- Called by server code right after it created the ₹0 order for this user. Idempotent and
-- race-safe (row lock): a second call returns the same site.
create or replace function public.fulfil_free_order(p_order_id uuid, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
  tv public.template_versions;
  new_site uuid;
begin
  select * into o from public.orders where id = p_order_id and user_id = p_user_id for update;
  if not found then
    return jsonb_build_object('status', 'unknown_order');
  end if;
  if o.amount_paise <> 0 or o.razorpay_order_id is not null then
    return jsonb_build_object('status', 'not_free', 'order_id', o.id);
  end if;
  if o.status = 'paid' then
    return jsonb_build_object('status', 'already', 'order_id', o.id,
      'site_id', (select id from public.sites where order_id = o.id));
  end if;
  if o.status <> 'created' then
    return jsonb_build_object('status', o.status, 'order_id', o.id);
  end if;

  select * into tv from public.template_versions
   where template_key = o.template_key and version = o.template_version;
  if not found then
    raise exception 'template version % / % missing', o.template_key, o.template_version;
  end if;

  update public.orders set status = 'paid', paid_at = now(), last_payment_error = null where id = o.id;

  insert into public.sites (user_id, order_id, template_key, template_version, status, draft_content, edit_until, expires_at)
  values (o.user_id, o.id, o.template_key, o.template_version, 'draft', tv.default_content,
          now() + make_interval(days => o.edit_days), now() + make_interval(days => o.live_days))
  returning id into new_site;

  insert into public.audit_log (actor_id, actor_role, action, target_type, target_id, meta)
  values (o.user_id, 'customer', 'order.free', 'order', o.id::text, jsonb_build_object('site_id', new_site));

  return jsonb_build_object('status', 'fulfilled', 'order_id', o.id, 'site_id', new_site);
end;
$$;

revoke all on function public.fulfil_free_order(uuid, uuid) from public, anon, authenticated;
grant execute on function public.fulfil_free_order(uuid, uuid) to service_role;
