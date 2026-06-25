-- Pass Pilot user profiles: location + role-specific fields (privacy-conscious, no street address).

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  postcode text,
  preferred_test_centre text,
  adi_number text,
  teaching_postcode text,
  preferred_test_centre_area text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_profiles_postcode_idx ON public.user_profiles (postcode);
CREATE INDEX IF NOT EXISTS user_profiles_preferred_test_centre_idx ON public.user_profiles (preferred_test_centre);
CREATE INDEX IF NOT EXISTS user_profiles_preferred_test_centre_area_idx ON public.user_profiles (preferred_test_centre_area);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profiles_select_own ON public.user_profiles;
CREATE POLICY user_profiles_select_own ON public.user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_profiles_insert_own ON public.user_profiles;
CREATE POLICY user_profiles_insert_own ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;
CREATE POLICY user_profiles_update_own ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_profiles IS
  'Learner/instructor/parent profile fields for personalisation and future anonymous analytics. Existing users may have NULL until they update their profile.';
