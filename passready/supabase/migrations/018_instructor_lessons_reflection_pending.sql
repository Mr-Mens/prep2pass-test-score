-- Add reflection_pending lesson status (additive). Run after migration 017.

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'instructor_lessons'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.instructor_lessons DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.instructor_lessons
  ADD CONSTRAINT instructor_lessons_status_check
  CHECK (status IN ('planned', 'completed', 'cancelled', 'reflection_pending'));
