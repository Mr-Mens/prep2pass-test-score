import type { GroupedRiskArea } from "@/lib/readiness-risk-areas";

function severityBadgeClass(severity: GroupedRiskArea["severity"]) {
  if (severity === "high") return "bg-red-50 text-red-900 ring-red-200";
  if (severity === "moderate") return "bg-amber-50 text-amber-950 ring-amber-200";
  return "bg-brand-50 text-brand-800 ring-brand-200";
}

function severityLabel(severity: GroupedRiskArea["severity"]) {
  if (severity === "high") return "High risk";
  if (severity === "moderate") return "Moderate risk";
  return "Low risk";
}

function severityMeterPercent(severity: GroupedRiskArea["severity"]) {
  if (severity === "high") return 92;
  if (severity === "moderate") return 62;
  return 36;
}

function severityMeterBarClass(severity: GroupedRiskArea["severity"]) {
  if (severity === "high") return "bg-red-500/90";
  if (severity === "moderate") return "bg-amber-400/95";
  return "bg-teal-600/85";
}

function SeverityMeterBar({ severity }: { severity: GroupedRiskArea["severity"] }) {
  const width = severityMeterPercent(severity);
  return (
    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-brand-100 print:hidden">
      <div
        className={`h-full rounded-full ${severityMeterBarClass(severity)}`}
        style={{ width: `${width}%` }}
        aria-hidden
      />
    </div>
  );
}

type Props = {
  blocks: GroupedRiskArea[];
  /** Slightly tighter spacing when embedded in print layouts. */
  compact?: boolean;
};

export function RiskAreasSection({ blocks, compact }: Props) {
  return (
    <div
      className={`rounded-2xl border border-brand-100 bg-white shadow-sm print:break-inside-avoid print:shadow-none ${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}
    >
      <h2 className="text-lg font-semibold tracking-tight text-brand-950">Your Test Risk Areas</h2>
      <p className="mt-2 max-w-prose text-xs leading-relaxed text-brand-600/90">
        Grouped by core driving skill areas. Prep2Pass is created by a DVSA-approved driving instructor, is independent,
        not affiliated with DVSA, and this is not an official DVSA score.
      </p>
      <div className={`mt-5 space-y-4 sm:mt-6 sm:space-y-5 ${compact ? "print:space-y-4" : ""}`}>
        {blocks.map((block) => (
          <article
            key={block.groupKey}
            className="rounded-2xl border border-brand-100/90 bg-brand-50/35 p-4 sm:p-5 print:break-inside-avoid"
          >
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-100/80 pb-3">
              <h3 className="text-base font-semibold leading-snug text-brand-950">{block.groupLabel}</h3>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${severityBadgeClass(
                  block.severity,
                )}`}
              >
                {severityLabel(block.severity)}
              </span>
            </header>

            <SeverityMeterBar severity={block.severity} />

            <p className="mt-3 text-sm leading-relaxed text-brand-800">{block.summary}</p>

            {block.skills.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Focus skills in this area">
                {block.skills.map((s) => (
                  <li
                    key={s.key}
                    className="max-w-[220px] rounded-lg border border-brand-200/90 bg-white px-3 py-2 text-sm text-brand-900 shadow-sm"
                  >
                    <span className="font-medium text-brand-950">{s.label}</span>
                    <span className="mt-1 block text-[11px] leading-snug text-brand-600">
                      Skill {s.officialSkillId} · {s.officialSkillName}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {block.highlights && block.highlights.length > 0 ? (
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-brand-800">
                {block.highlights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}

            {block.legacyIssues && block.legacyIssues.length > 0 ? (
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-brand-800">
                {block.legacyIssues.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
