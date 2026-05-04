import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Space above the debrief block (e.g. mt-6 under meta, mt-8 under score row). */
  className?: string;
};

/**
 * Opening summary: calm panel, readable measure, tidy edges (justified body with last line left-aligned).
 */
export function ReportSummaryDebrief({ children, className = "mt-8" }: Props) {
  return (
    <div className={`${className} print:break-inside-avoid`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-500">Your debrief</p>
      <div
        className="mt-2.5 rounded-xl border border-brand-200/80 border-l-[3px] border-l-teal-600 bg-white px-5 py-5 sm:mt-3 sm:px-7 sm:py-6 print:border-brand-200 print:bg-white"
        role="region"
        aria-label="Report summary"
      >
        <div className="mx-auto max-w-[62ch] text-[0.98rem] leading-[1.72] text-brand-900 sm:text-[1.0625rem] sm:leading-[1.7] [&_p]:text-pretty [&_p]:text-left sm:[&_p]:text-justify sm:[&_p]:[text-align-last:left]">
          {children}
        </div>
      </div>
    </div>
  );
}
