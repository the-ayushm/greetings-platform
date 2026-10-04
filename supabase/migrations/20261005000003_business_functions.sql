-- ════════════════════════════════════════════════════════════════════
-- Transactional business operations. All are SECURITY DEFINER and executable by
-- service_role only: the app calls them after authenticating/validating the request.
-- ════════════════════════════════════════════════════════════════════

-- Payment captured (from the checkout callback or the webhook — whichever arrives first).
-- Idempotent: one order → one paid payment → one site. A second, different captured payment
-- on an already-paid order is recorded as a duplicate so the caller can refund it.
create or replace function public.fulfil_order(
  p_razorpay_order_id text,
  p_payment_id text,
  p_amount int,
  p_currency text,
  p_method text,
  p_actor text default 'webhook'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
  tv public.template_versions;
  existing public.payments;
  new_site uuid;
begin
  select * into o from public.orders where razorpay_order_id = p_razorpay_order_id for update;
  if not found then
    return jsonb_build_object('status', 'unknown_order');
  end if;

  select * into existing from public.payments where razorpay_payment_id = p_payment_id;
  if found then
    return jsonb_build_object('status', 'already', 'order_id', o.id,
      'site_id', (select id from public.sites where order_id = o.id));
  end if;

  if p_amount <> o.amount_paise or p_currency <> o.currency then
    insert into public.audit_log (actor_role, action, target_type, target_id, meta)
    values ('system', 'payment.amount_mismatch', 'order', o.id::text,
            jsonb_build_object('payment_id', p_payment_id, 'amount', p_amount, 'expected', o.amount_paise));
    return jsonb_build_object('status', 'amount_mismatch', 'order_id', o.id);
  end if;

  if o.status <> 'created' then
    insert into public.payments (order_id, razorpay_payment_id, amount_paise, currency, status, method, is_duplicate)
    values (o.id, p_payment_id, p_amount, p_currency, 'captured', p_method, true);
    insert into public.audit_log (actor_role, action, target_type, target_id, meta)
    values ('system', 'payment.duplicate', 'order', o.id::text, jsonb_build_object('payment_id', p_payment_id));
    return jsonb_build_object('status', 'duplicate', 'order_id', o.id);
  end if;

  select * into tv from public.template_versions
   where template_key = o.template_key and version = o.template_version;
  if not found then
    raise exception 'template version % / % missing', o.template_key, o.template_version;
  end if;

  insert into public.payments (order_id, razorpay_payment_id, amount_paise, currency, status, method)
  values (o.id, p_payment_id, p_amount, p_currency, 'captured', p_method);

  update public.orders set status = 'paid', paid_at = now(), last_payment_error = null where id = o.id;

  if o.user_id is null then
    -- Account was deleted while the payment was in flight: keep the money record, no site.
    return jsonb_build_object('status', 'fulfilled_no_owner', 'order_id', o.id);
  end if;

  insert into public.sites (user_id, order_id, template_key, template_version, status, draft_content, edit_until, expires_at)
  values (o.user_id, o.id, o.template_key, o.template_version, 'draft', tv.default_content,
          now() + make_interval(days => o.edit_days), now() + make_interval(days => o.live_days))
  returning id into new_site;

  insert into public.audit_log (actor_id, actor_role, action, target_type, target_id, meta)
  values (o.user_id, case when p_actor = 'webhook' then 'webhook' else 'system' end, 'order.paid', 'order', o.id::text,
          jsonb_build_object('payment_id', p_payment_id, 'site_id', new_site, 'via', p_actor));

  return jsonb_build_object('status', 'fulfilled', 'order_id', o.id, 'site_id', new_site);
end;
$$;

-- A refund has been processed by Razorpay. Full refund of the paid payment → order refunded,
-- site disabled (link stops working). Refunds of duplicates just close the duplicate.
create or replace function public.apply_refund(
  p_payment_id text,
  p_refund_id text,
  p_amount int,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  pay public.payments;
  o public.orders;
begin
  select * into pay from public.payments where razorpay_payment_id = p_payment_id for update;
  if not found then
    return jsonb_build_object('status', 'unknown_payment');
  end if;
  select * into o from public.orders where id = pay.order_id for update;

  update public.payments
     set refund_status = p_status,
         razorpay_refund_id = coalesce(p_refund_id, razorpay_refund_id),
         refunded_paise = case when p_status = 'processed' then greatest(refunded_paise, p_amount) else refunded_paise end,
         status = case when p_status = 'processed' and p_amount >= amount_paise then 'refunded' else status end
   where id = pay.id;

  if p_status = 'processed' and not pay.is_duplicate and p_amount >= pay.amount_paise then
    update public.orders set status = 'refunded', refunded_at = now() where id = o.id;
    update public.sites set status = 'disabled', disabled_reason = 'refunded'
     where order_id = o.id and status <> 'deleted';
  elsif p_status = 'pending' and not pay.is_duplicate then
    update public.orders set status = 'refund_pending' where id = o.id and status = 'paid';
  elsif p_status = 'failed' and not pay.is_duplicate then
    update public.orders set status = 'paid' where id = o.id and status = 'refund_pending';
  end if;

  insert into public.audit_log (actor_role, action, target_type, target_id, meta)
  values ('webhook', 'refund.' || p_status, 'order', o.id::text,
          jsonb_build_object('payment_id', p_payment_id, 'refund_id', p_refund_id, 'amount', p_amount, 'duplicate', pay.is_duplicate));
  return jsonb_build_object('status', 'ok', 'order_id', o.id);
end;
$$;

-- Publish a validated snapshot. Ownership, status and the edit window are re-checked here so a
-- bug in the caller cannot publish someone else's site or edit past the window.
create or replace function public.publish_site(
  p_site_id uuid,
  p_user_id uuid,
  p_content jsonb,
  p_schema_version int,
  p_new_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.sites;
  v int;
  vid uuid;
begin
  select * into s from public.sites where id = p_site_id and user_id = p_user_id for update;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  if s.status not in ('draft', 'published', 'unpublished') then
    return jsonb_build_object('status', 'locked', 'site_status', s.status);
  end if;
  if s.edit_until < now() or s.expires_at < now() then
    return jsonb_build_object('status', 'edit_window_closed');
  end if;

  select coalesce(max(version), 0) + 1 into v from public.site_versions where site_id = s.id;
  insert into public.site_versions (site_id, version, content, schema_version, created_by)
  values (s.id, v, p_content, p_schema_version, p_user_id)
  returning id into vid;

  update public.sites
     set published_version_id = vid,
         status = 'published',
         published_at = now(),
         slug = coalesce(slug, p_new_slug)
   where id = s.id;

  insert into public.audit_log (actor_id, actor_role, action, target_type, target_id, meta)
  values (p_user_id, 'customer', 'site.published', 'site', s.id::text, jsonb_build_object('version', v));

  return jsonb_build_object('status', 'published', 'version', v,
                            'slug', (select slug from public.sites where id = s.id));
end;
$$;

-- Recipient opened the page (counted from the browser after load, so link-preview bots that
-- don't run JavaScript don't count).
create or replace function public.record_view(p_site_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.sites
     set view_count = view_count + 1,
         first_viewed_at = coalesce(first_viewed_at, now())
   where id = p_site_id and status = 'published';
$$;

revoke all on function public.fulfil_order(text, text, int, text, text, text) from public, anon, authenticated;
revoke all on function public.apply_refund(text, text, int, text) from public, anon, authenticated;
revoke all on function public.publish_site(uuid, uuid, jsonb, int, text) from public, anon, authenticated;
revoke all on function public.record_view(uuid) from public, anon, authenticated;
revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_user_email_change() from public, anon, authenticated;
revoke all on function public.assets_owner_matches_site() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
grant execute on function public.fulfil_order(text, text, int, text, text, text) to service_role;
grant execute on function public.apply_refund(text, text, int, text) to service_role;
grant execute on function public.publish_site(uuid, uuid, jsonb, int, text) to service_role;
grant execute on function public.record_view(uuid) to service_role;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;
