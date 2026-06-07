-- Parent / Supervisor module (additive). Run after migration 005.

CREATE TABLE IF NOT EXISTS public.parent_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parent_learner_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  learner_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  learner_email text NOT NULL,
  learner_name text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'linked', 'revoked')),
  invitation_token text,
  linked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS parent_learner_links_parent_email_unique
  ON public.parent_learner_links (parent_user_id, learner_email);

ALTER TABLE public.parent_learner_links
  DROP CONSTRAINT IF EXISTS parent_learner_links_parent_email_key;

ALTER TABLE public.parent_learner_links
  ADD CONSTRAINT parent_learner_links_parent_email_key UNIQUE (parent_user_id, learner_email);

CREATE INDEX IF NOT EXISTS parent_learner_links_parent_idx
  ON public.parent_learner_links (parent_user_id);

CREATE INDEX IF NOT EXISTS parent_learner_links_learner_idx
  ON public.parent_learner_links (learner_user_id);

CREATE TABLE IF NOT EXISTS public.practice_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  learner_link_id uuid REFERENCES public.parent_learner_links (id) ON DELETE SET NULL,
  practiced_on date NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  road_type text NOT NULL,
  skills_practised text[] NOT NULL DEFAULT '{}'::text[],
  confidence_rating integer NOT NULL CHECK (confidence_rating >= 1 AND confidence_rating <= 5),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS practice_logs_parent_idx ON public.practice_logs (parent_user_id);
CREATE INDEX IF NOT EXISTS practice_logs_practiced_on_idx ON public.practice_logs (practiced_on DESC);

ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_learner_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parent_profiles_own" ON public.parent_profiles;
CREATE POLICY "parent_profiles_own"
  ON public.parent_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "parent_learner_links_own" ON public.parent_learner_links;
CREATE POLICY "parent_learner_links_own"
  ON public.parent_learner_links FOR ALL TO authenticated
  USING (auth.uid() = parent_user_id)
  WITH CHECK (auth.uid() = parent_user_id);

DROP POLICY IF EXISTS "practice_logs_own" ON public.practice_logs;
CREATE POLICY "practice_logs_own"
  ON public.practice_logs FOR ALL TO authenticated
  USING (auth.uid() = parent_user_id)
  WITH CHECK (auth.uid() = parent_user_id);
