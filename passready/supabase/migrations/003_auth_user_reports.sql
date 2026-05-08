-- Auth-scoped reports and lifetime access (run after baseline schema.sql).
-- In Supabase: SQL Editor → paste and run once per project.

-- Lifetime access keyed by authenticated user ID (preferred over email-only).
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  lifetime_access BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_entitlements_lifetime_idx
  ON public.user_entitlements (lifetime_access)
  WHERE lifetime_access = true;

-- Link saved reports and payments to the account that paid.
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON public.reports (user_id);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments (user_id);

-- Optional: migrate legacy lifetime rows keyed by email (requires matching accounts in auth.users).
-- INSERT INTO public.user_entitlements (user_id, lifetime_access, updated_at)
-- SELECT au.id, true, ce.updated_at
-- FROM public.customer_entitlements ce
-- JOIN auth.users au ON lower(au.email) = ce.email
-- WHERE ce.lifetime_access = true
-- ON CONFLICT (user_id) DO UPDATE SET lifetime_access = true, updated_at = excluded.updated_at;

-- Defense in depth: authenticated Postgres role respects row ownership (service role bypasses RLS).
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_read_own_reports" ON public.reports;
CREATE POLICY "authenticated_read_own_reports"
  ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
