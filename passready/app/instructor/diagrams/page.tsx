const items = [
  { title: "Left turns", description: "Approach lines and cut-in points — coming soon." },
  { title: "Right turns", description: "Positioning and priority — coming soon." },
  { title: "Roundabouts", description: "Lanes and exits — coming soon." },
  { title: "Meeting traffic", description: "Passing places — coming soon." },
  { title: "Crossroads", description: "Emerging and priority — coming soon." },
  { title: "Bay parking", description: "Reference points — coming soon." },
  { title: "Parallel parking", description: "Set piece — coming soon." },
  { title: "Dual carriageways", description: "Slip roads and lanes — coming soon." },
] as const;

export default function InstructorDiagramsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Teaching diagrams</h1>
        <p className="mt-2 max-w-2xl text-sm text-brand-600">
          Placeholder cards for future diagram content. Independent prep tool — not affiliated with DVSA.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex min-h-[140px] flex-col rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
          >
            <p className="font-semibold text-brand-950">{item.title}</p>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-600">{item.description}</p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-brand-400">Placeholder</p>
          </div>
        ))}
      </div>
    </div>
  );
}
