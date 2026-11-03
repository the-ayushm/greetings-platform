-- ════════════════════════════════════════════════════════════════════
-- Digital Gifting storefront: two optional merchandising fields on products, edited in
-- Admin → Templates & pricing. Additive only; existing rows keep their behaviour.
--   is_featured       — shown in "Trending Experiences" and first in "Featured" sorting.
--   compare_at_paise  — optional original price (MRP). The store shows a discount only when it
--                       is set AND higher than the real price. Never used for charging.
-- ════════════════════════════════════════════════════════════════════

alter table public.products
  add column if not exists is_featured boolean not null default false,
  add column if not exists compare_at_paise int check (compare_at_paise is null or compare_at_paise between 100 and 10000000);
