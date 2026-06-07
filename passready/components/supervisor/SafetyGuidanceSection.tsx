import { SUPERVISOR_SAFETY_GUIDANCE } from "@/lib/supervisor/safety-guidance";

export function SafetyGuidanceSection() {
  return (
    <section>
      <h2 className="font-heading text-lg font-semibold text-brand-950">Safety guidance</h2>
      <p className="mt-1 text-sm text-brand-600">Calm, practical reminders for supervising private practice.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {SUPERVISOR_SAFETY_GUIDANCE.map((card) => (
          <article key={card.id} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm ring-1 ring-brand-50">
            <h3 className="font-heading text-base font-semibold text-brand-950">{card.title}</h3>
            <ul className="mt-3 space-y-2">
              {card.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-brand-700">
                  <span className="text-teal-600" aria-hidden>
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
