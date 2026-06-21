import "server-only";

import { renderPassPilotEmailLayout, stripHtmlToText } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/resend";

export async function sendMockTestReportEmail(input: {
  toEmail: string;
  viewUrl: string;
  instructorName: string;
  outcome: string;
  pupilName: string;
}): Promise<void> {
  const outcomeLabel = input.outcome.charAt(0).toUpperCase() + input.outcome.slice(1);
  const instructorName = input.instructorName.trim() || "Your instructor";

  const bodyHtml = `<p style="margin:0 0 12px 0;">${escape(instructorName)} has shared your DVSA-style mock test result (${escape(outcomeLabel)}) for ${escape(input.pupilName)}.</p>
    <p style="margin:0;">Open Pass Pilot to review faults, notes, and suggested focus areas.</p>`;

  const html = renderPassPilotEmailLayout({
    preheader: "Your mock test report is ready",
    heading: "Mock test report ready",
    bodyHtml,
    cta: { label: "View mock test report", href: input.viewUrl },
    fallbackUrl: input.viewUrl,
  });

  const text = stripHtmlToText(`Mock test report ready\n\nView report: ${input.viewUrl}`);

  await sendEmail({
    to: input.toEmail,
    subject: `Your mock test report from ${instructorName}`,
    html,
    text,
  });
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
