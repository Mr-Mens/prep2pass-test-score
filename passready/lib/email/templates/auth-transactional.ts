import "server-only";

import { buildSupabaseAuthVerifyUrl } from "@/lib/email/build-auth-verify-url";
import { renderPassPilotEmailLayout, stripHtmlToText } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/resend";

export type SupabaseAuthEmailData = {
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
};

type AuthEmailContent = {
  subject: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  preheader: string;
};

function contentForActionType(actionType: string): AuthEmailContent {
  switch (actionType) {
    case "signup":
      return {
        subject: "Confirm your Pass Pilot email",
        heading: "Confirm your email",
        preheader: "Confirm your Pass Pilot email address",
        bodyHtml:
          "<p style=\"margin:0 0 12px 0;\">Thanks for signing up to Pass Pilot. Open the button below to confirm this email address and finish setting up your account.</p><p style=\"margin:0;\">If you did not create an account, you can ignore this email.</p>",
        ctaLabel: "Confirm email",
      };
    case "recovery":
      return {
        subject: "Reset your Pass Pilot password",
        heading: "Reset your password",
        preheader: "Reset your Pass Pilot password",
        bodyHtml:
          "<p style=\"margin:0 0 12px 0;\">We received a request to reset the password for your Pass Pilot account.</p><p style=\"margin:0;\">If you did not ask for this, you can ignore this email.</p>",
        ctaLabel: "Reset password",
      };
    case "magiclink":
      return {
        subject: "Sign in to Pass Pilot",
        heading: "Sign in to Pass Pilot",
        preheader: "Sign in to Pass Pilot",
        bodyHtml:
          "<p style=\"margin:0 0 12px 0;\">Use the button below to sign in to Pass Pilot.</p><p style=\"margin:0;\">If you did not request this, you can ignore this email.</p>",
        ctaLabel: "Sign in",
      };
    case "email_change":
      return {
        subject: "Confirm your new Pass Pilot email",
        heading: "Confirm your new email",
        preheader: "Confirm your new email address for Pass Pilot",
        bodyHtml:
          "<p style=\"margin:0 0 12px 0;\">Confirm this email address to update your Pass Pilot account.</p><p style=\"margin:0;\">If you did not request this change, contact support.</p>",
        ctaLabel: "Confirm new email",
      };
    case "reauthentication":
      return {
        subject: "Confirm your identity on Pass Pilot",
        heading: "Confirm it is you",
        preheader: "Confirm your identity on Pass Pilot",
        bodyHtml:
          "<p style=\"margin:0;\">Pass Pilot needs you to confirm your identity before continuing. Use the button below.</p>",
        ctaLabel: "Continue",
      };
    case "invite":
      return {
        subject: "You are invited to Pass Pilot",
        heading: "You are invited to Pass Pilot",
        preheader: "Accept your Pass Pilot invitation",
        bodyHtml:
          "<p style=\"margin:0;\">You have been invited to Pass Pilot. Use the button below to accept and set up your account.</p>",
        ctaLabel: "Accept invitation",
      };
    default:
      return {
        subject: "Pass Pilot account email",
        heading: "Pass Pilot",
        preheader: "Pass Pilot account email",
        bodyHtml: "<p style=\"margin:0;\">Use the button below to continue with your Pass Pilot account.</p>",
        ctaLabel: "Continue",
      };
  }
}

export async function sendSupabaseAuthEmail(input: {
  toEmail: string;
  emailData: SupabaseAuthEmailData;
}): Promise<void> {
  const verifyUrl = buildSupabaseAuthVerifyUrl(input.emailData);
  const content = contentForActionType(input.emailData.email_action_type);

  const html = renderPassPilotEmailLayout({
    preheader: content.preheader,
    heading: content.heading,
    bodyHtml: content.bodyHtml,
    cta: { label: content.ctaLabel, href: verifyUrl },
    fallbackUrl: verifyUrl,
  });

  const text = stripHtmlToText(`${content.heading}\n\n${content.ctaLabel}: ${verifyUrl}`);

  await sendEmail({
    to: input.toEmail,
    subject: content.subject,
    html,
    text,
  });
}
