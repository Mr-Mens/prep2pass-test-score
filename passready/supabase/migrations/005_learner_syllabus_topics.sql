-- Future-ready per-user syllabus topic ticks (mirrors IDs in lib/syllabus-topics.ts).

create table if not exists public.learner_syllabus_topic_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null,
  source text not null default 'self_report' check (source in ('self_report', 'instructor_verified')),
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create index if not exists learner_syllabus_topic_progress_user_updated_idx
  on public.learner_syllabus_topic_progress (user_id, updated_at desc);

comment on table public.learner_syllabus_topic_progress is
  'Per-topic practise flags for learner syllabus roadmap. topic_id aligns with Prep2Pass app catalogue in syllabus-topics.ts.';
