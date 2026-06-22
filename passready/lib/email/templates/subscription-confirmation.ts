import "server-only";

import { PRICING, SMART_UI } from "@/lib/constants";
import { getAppUrlForEmail } from "@/lib/email/app-url";
import { renderPassPilotEmailLayout, stripHtmlToText } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/resend";

export async function sendSubscriptionConfirmationEmail(input: {
  toEmail: string;
  firstName?: string | null;
}): Promise<void> {
  const appUrl = getAppUrlForEmail();
  const dashboardUrl = `${appUrl}/dashboard`;
  const greeting = input.firstName?.trim() ? `Hi ${input.firstName.trim()},` : "Hi,";

  const bodyHtml = `<p style="margin:0 0 12px 0;">${escape(greeting)}</p>
    <p style="margin:0 0 12px 0;">Your Pass Pilot subscription is active at ${escape(PRICING.subscription.display)}/month until you pass or cancel.</p>
    <p style="margin:0;">You now have unlimited assessments, progress tracking, and ${escape(SMART_UI.personalisedReports)}.</p>`;

  const html = renderPassPilotEmailLayout({
    preheader: "Your Pass Pilot subscription is active",
    heading: "Subscription confirmed",
    bodyHtml,
    cta: { label: "Open dashboard", href: dashboardUrl },
    fallbackUrl: dashboardUrl,
  });

  const text = stripHtmlToText(`${greeting}\n\nYour Pass Pilot subscription is active.\n\nOpen dashboard: ${dashboardUrl}`);

  await sendEmail({
    to: input.toEmail,
    subject: "Your Pass Pilot subscription is active",
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
