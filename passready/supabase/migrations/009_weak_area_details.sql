-- Optional structured follow-up when learners flag weak areas (AI/report enrichment only; not used in scoring).
alter table public.reports
  add column if not exists weak_area_details jsonb not null default '[]'::jsonb;

comment on column public.reports.weak_area_details is
  'Learner-selected subtopics and optional notes per weak-area follow-up category.';
