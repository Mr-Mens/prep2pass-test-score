const MIGRATION_HINT =
  "Run supabase/migrations/006_parent_supervisor_module.sql in the Supabase SQL Editor.";

export function SupervisorMigrationBanner() {
  return (
    <div
      role="status"
      className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-950"
    >
      <p className="font-semibold">Parent module database setup required</p>
      <p className="mt-2">
        Practice logs and learner linking need one SQL migration in Supabase. {MIGRATION_HINT}
      </p>
    </div>
  );
}
