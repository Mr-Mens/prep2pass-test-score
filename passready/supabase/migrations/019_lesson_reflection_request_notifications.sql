-- In-app notifications when an instructor marks a lesson complete (additive).

CREATE UNIQUE INDEX IF NOT EXISTS app_notifications_lesson_reflection_request
  ON public.app_notifications ((action_payload->>'lessonId'))
  WHERE kind = 'lesson_reflection_request' AND resolved_at IS NULL;
