-- ════════════════════════════════════════════════════════════════════
-- "Do You Love Me?" (template `doyouloveme`): the partner's Yes is recorded in the existing
-- site_responses table (owner-only through RLS, written only by server code after it checked
-- that the page is published, unlocked and has notifications switched on).
-- Additive only: widens the allowed kinds; existing rows are untouched.
-- ════════════════════════════════════════════════════════════════════

alter table public.site_responses drop constraint if exists site_responses_kind_check;
alter table public.site_responses add constraint site_responses_kind_check check (kind in ('text', 'slider', 'coupon', 'answer'));
