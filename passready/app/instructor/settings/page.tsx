export default function InstructorSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-brand-600">
          Instructor profile preferences will expand here (display name, ADI reference, notifications).
        </p>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Profile</h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-700">
          Your sidebar shows the name from your account metadata or instructor profile. To change how your name appears,
          update your account details or ask your administrator to set your instructor profile in the database.
        </p>
        <p className="mt-4 text-sm text-brand-500">
          ADI number is a placeholder for now — future releases will support editable instructor credentials here.
        </p>
      </section>
    </div>
  );
}
