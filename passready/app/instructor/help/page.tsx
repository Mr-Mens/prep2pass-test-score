import Link from "next/link";

export default function InstructorHelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Help &amp; support</h1>
        <p className="mt-2 text-sm text-brand-600">
          The DVSA-style mock test tool is for instructor use only. It is independent and not affiliated with DVSA.
        </p>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Scoring</h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-brand-700">
          <li>Serious or dangerous fault recorded → fail.</li>
          <li>Driving faults (minors) over your threshold → fail (default threshold 15).</li>
          <li>Threshold can be adjusted on the mock test form for future subscription tiers.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Pupil linking</h2>
        <p className="mt-4 text-sm leading-relaxed text-brand-700">
          When you save a pupil email that matches an existing Test Ready Score Report email, we store a link so their
          account can be associated with your pupil record. Full pupil-facing views of mock summaries can be enabled in a
          future update.
        </p>
      </section>

      <p className="text-sm text-brand-600">
        For product help, contact your Pass Pilot administrator. Learner help:{" "}
        <Link href="/explore" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
          explore the learner site
        </Link>
        .
      </p>
    </div>
  );
}
