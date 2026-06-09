-- Instructor pupil invitations + in-app notifications (additive).

ALTER TABLE public.instructor_pupils
  ADD COLUMN IF NOT EXISTS link_status text NOT NULL DEFAULT 'pending'
    CHECK (link_status IN ('pending', 'accepted', 'declined', 'revoked'));

ALTER TABLE public.instructor_pupils
  ADD COLUMN IF NOT EXISTS link_responded_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS instructor_pupils_instructor_email_key
  ON public.instructor_pupils (instructor_user_id, pupil_email);

UPDATE public.instructor_pupils
SET link_status = 'accepted',
    link_responded_at = COALESCE(link_responded_at, updated_at, created_at)
WHERE linked_learner_user_id IS NOT NULL
  AND link_status = 'pending';

CREATE TABLE IF NOT EXISTS public.app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  action_type text,
  action_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_notifications_user_idx ON public.app_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS app_notifications_unresolved_idx
  ON public.app_notifications (user_id)
  WHERE resolved_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS instructor_pupils_pending_invite_notification
  ON public.app_notifications ((action_payload->>'pupilLinkId'))
  WHERE kind = 'instructor_pupil_invite' AND resolved_at IS NULL;

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_notifications_own" ON public.app_notifications;
CREATE POLICY "app_notifications_own"
  ON public.app_notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
