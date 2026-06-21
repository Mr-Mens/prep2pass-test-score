import "server-only";

import { PRODUCT } from "@/lib/constants";

import { getAppUrlForEmail } from "./app-url";

const NAVY = "#1c2b38";
const TEAL = "#0f766e";

export type PassPilotEmailLayoutOptions = {
  preheader?: string;
  heading: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  fallbackUrl?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderPassPilotEmailLayout(options: PassPilotEmailLayoutOptions): string {
  const appUrl = getAppUrlForEmail();
  const preheader = options.preheader ? escapeHtml(options.preheader) : escapeHtml(options.heading);
  const heading = escapeHtml(options.heading);
  const cta = options.cta
    ? `<tr>
          <td style="padding:20px 24px 8px 24px;">
            <a
              href="${escapeHtml(options.cta.href)}"
              style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;line-height:1;border-radius:12px;padding:14px 22px;"
            >
              ${escapeHtml(options.cta.label)}
            </a>
          </td>
        </tr>`
    : "";
  const fallback = options.fallbackUrl
    ? `<tr>
          <td style="padding:8px 24px 0 24px;">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;word-break:break-all;">
              Or copy this link:<br />
              <a href="${escapeHtml(options.fallbackUrl)}" style="color:${TEAL};">${escapeHtml(options.fallbackUrl)}</a>
            </p>
          </td>
        </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #d7e2ee;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px 4px 24px;">
                <p style="margin:0;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${TEAL};">${escapeHtml(PRODUCT.name)}</p>
                <p style="margin:6px 0 0 0;font-size:13px;line-height:1.4;color:#64748b;">${escapeHtml(PRODUCT.tagline)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px 4px 24px;">
                <h1 style="margin:0;font-size:24px;line-height:1.25;color:#0f172a;">${heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 0 24px;font-size:15px;line-height:1.6;color:#334155;">
                ${options.bodyHtml}
              </td>
            </tr>
            ${cta}
            ${fallback}
            <tr>
              <td style="padding:16px 24px 20px 24px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">
                  Pass Pilot helps learners, instructors and parents understand readiness before test day.
                </p>
                <p style="margin:8px 0 0 0;font-size:13px;line-height:1.6;color:#64748b;">
                  Independent and not affiliated with DVSA.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0 0;font-size:12px;line-height:1.5;color:#64748b;">
            <a href="${escapeHtml(appUrl)}" style="color:${TEAL};text-decoration:none;">${escapeHtml(appUrl)}</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
