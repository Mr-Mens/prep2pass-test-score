-- Account lifecycle for admin user management (pause / reinstate).
-- Run in Supabase SQL Editor after migration 023.

ALTER TABLE public.user_app_profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'paused'));

CREATE INDEX IF NOT EXISTS user_app_profiles_account_status_idx
  ON public.user_app_profiles (account_status);
