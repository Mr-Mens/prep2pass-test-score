-- Promote djacapony@gmail.com to parent (run in Supabase SQL Editor if not applied via CLI).

INSERT INTO public.user_app_profiles (user_id, role, updated_at)
SELECT id, 'parent', now()
FROM auth.users
WHERE lower(trim(email)) = lower('djacapony@gmail.com')
ON CONFLICT (user_id) DO UPDATE
SET role = 'parent', updated_at = now();

INSERT INTO public.parent_profiles (user_id, updated_at)
SELECT id, now()
FROM auth.users
WHERE lower(trim(email)) = lower('djacapony@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET updated_at = now();
