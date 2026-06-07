import { SUPERVISOR_DISCLAIMERS } from "@/lib/supervisor/safety-guidance";

export function SupervisorDisclaimers({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      className={`rounded-2xl border border-brand-100 bg-brand-50/50 text-brand-700 ${
        compact ? "p-4 text-xs leading-relaxed" : "p-5 text-sm leading-relaxed"
      }`}
    >
      <p>{SUPERVISOR_DISCLAIMERS.support}</p>
      <p className={compact ? "mt-2" : "mt-3"}>{SUPERVISOR_DISCLAIMERS.legal}</p>
    </aside>
  );
}
