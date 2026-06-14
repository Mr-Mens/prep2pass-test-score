-- Promote philipandportia@gmail.com to instructor (run in Supabase SQL Editor if not applied via CLI).

INSERT INTO public.user_app_profiles (user_id, role, updated_at)
SELECT id, 'instructor', now()
FROM auth.users
WHERE lower(trim(email)) = lower('philipandportia@gmail.com')
ON CONFLICT (user_id) DO UPDATE
SET role = 'instructor', updated_at = now();

INSERT INTO public.instructor_profiles (user_id, updated_at)
SELECT id, now()
FROM auth.users
WHERE lower(trim(email)) = lower('philipandportia@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET updated_at = now();
