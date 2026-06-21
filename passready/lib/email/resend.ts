import "server-only";

import { Resend } from "resend";

export class EmailNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailNotConfiguredError";
  }
}

let cachedResend: Resend | null = null;

export function getEmailFromAddress(): string {
  const from = process.env.EMAIL_FROM?.trim();
  if (from) return from;
  const legacy = process.env.REPORT_ACCESS_FROM_EMAIL?.trim();
  if (legacy) return legacy;
  if (process.env.NODE_ENV === "production") {
    throw new EmailNotConfiguredError("EMAIL_FROM is not configured");
  }
  return "Pass Pilot <onboarding@resend.dev>";
}

function getResendApiKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim();
  return key || null;
}

export function getResendClient(): Resend {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new EmailNotConfiguredError("RESEND_API_KEY is not configured");
    }
    throw new EmailNotConfiguredError("RESEND_API_KEY is not configured");
  }
  if (!cachedResend) {
    cachedResend = new Resend(apiKey);
  }
  return cachedResend;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = { sent: true; id?: string } | { sent: false; skipped: true; reason: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = getResendApiKey();
  const toList = Array.isArray(input.to) ? input.to : [input.to];

  if (!apiKey) {
    const preview = `[email] To: ${toList.join(", ")} | Subject: ${input.subject}`;
    if (process.env.NODE_ENV !== "production") {
      console.info(preview);
      const urlMatch = input.text?.match(/https?:\/\/[^\s]+/) ?? input.html.match(/href="(https?:\/\/[^"]+)"/);
      if (urlMatch) {
        console.info(`[email] Link: ${urlMatch[1] ?? urlMatch[0]}`);
      }
      return { sent: false, skipped: true, reason: "RESEND_API_KEY is not configured" };
    }
    throw new EmailNotConfiguredError(
      "Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM in your environment.",
    );
  }

  getEmailFromAddress();

  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: getEmailFromAddress(),
    to: toList,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    throw new Error(error.message || "Failed to send email");
  }

  return { sent: true, id: data?.id };
}
