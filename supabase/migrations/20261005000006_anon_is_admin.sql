-- The public catalog policy (templates/products) calls is_admin(); anonymous visitors need to
-- be able to evaluate it (it simply returns false for them).
grant execute on function public.is_admin() to anon;
