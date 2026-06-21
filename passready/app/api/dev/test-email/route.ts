import { NextResponse } from "next/server";

import { renderPassPilotEmailLayout, stripHtmlToText } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/resend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { to?: string };
  try {
    body = (await request.json()) as { to?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const to = body.to?.trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "Provide a valid `to` email address." }, { status: 400 });
  }

  const html = renderPassPilotEmailLayout({
    preheader: "Pass Pilot test email",
    heading: "Pass Pilot test email",
    bodyHtml:
      '<p style="margin:0;">This is a development test message from Pass Pilot. If you received this in production, something is misconfigured.</p>',
    cta: { label: "Open Pass Pilot", href: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" },
  });

  try {
    const result = await sendEmail({
      to,
      subject: "Pass Pilot test email",
      html,
      text: stripHtmlToText("Pass Pilot test email"),
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send test email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
