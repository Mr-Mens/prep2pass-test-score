-- Teaching diagrams library (V1 schema; content served from code catalog until published to DB).
-- Run in Supabase SQL Editor after migration 012.

CREATE TABLE IF NOT EXISTS public.diagram_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.diagram_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.diagram_categories (id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  teaching_time_minutes integer,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  teaching_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  common_mistakes jsonb NOT NULL DEFAULT '[]'::jsonb,
  related_slugs text[] NOT NULL DEFAULT '{}',
  keywords text[] NOT NULL DEFAULT '{}',
  svg_key text,
  published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS diagram_templates_category_idx
  ON public.diagram_templates (category_id);

CREATE INDEX IF NOT EXISTS diagram_templates_published_idx
  ON public.diagram_templates (published);

CREATE TABLE IF NOT EXISTS public.diagram_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_template_id uuid NOT NULL REFERENCES public.diagram_templates (id) ON DELETE CASCADE,
  instructor_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  pupil_id uuid REFERENCES public.instructor_pupils (id) ON DELETE SET NULL,
  title text,
  annotation_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS diagram_annotations_instructor_idx
  ON public.diagram_annotations (instructor_user_id);

CREATE INDEX IF NOT EXISTS diagram_annotations_template_idx
  ON public.diagram_annotations (diagram_template_id);

ALTER TABLE public.diagram_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagram_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagram_annotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diagram_categories_read_authenticated" ON public.diagram_categories;
CREATE POLICY "diagram_categories_read_authenticated"
  ON public.diagram_categories FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "diagram_templates_read_published" ON public.diagram_templates;
CREATE POLICY "diagram_templates_read_published"
  ON public.diagram_templates FOR SELECT TO authenticated
  USING (published = true);

DROP POLICY IF EXISTS "diagram_annotations_own" ON public.diagram_annotations;
CREATE POLICY "diagram_annotations_own"
  ON public.diagram_annotations FOR ALL TO authenticated
  USING (auth.uid() = instructor_user_id)
  WITH CHECK (auth.uid() = instructor_user_id);
