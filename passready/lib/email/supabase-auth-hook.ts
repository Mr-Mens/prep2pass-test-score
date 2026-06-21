import "server-only";

import { Webhook } from "standardwebhooks";

import { sendSupabaseAuthEmail, type SupabaseAuthEmailData } from "@/lib/email/templates/auth-transactional";

type SendEmailHookPayload = {
  user: { email: string };
  email_data: SupabaseAuthEmailData & {
    token?: string;
    site_url?: string;
    token_new?: string;
    token_hash_new?: string;
  };
};

export function normalizeSendEmailHookSecret(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("v1,whsec_")) {
    return trimmed.slice("v1,whsec_".length);
  }
  if (trimmed.startsWith("whsec_")) {
    return trimmed.slice("whsec_".length);
  }
  return trimmed;
}

export async function handleSupabaseSendEmailHook(request: Request): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const secretRaw = process.env.SUPABASE_AUTH_SEND_EMAIL_HOOK_SECRET?.trim();
  if (!secretRaw) {
    return { ok: false, status: 500, message: "SUPABASE_AUTH_SEND_EMAIL_HOOK_SECRET is not configured" };
  }

  const payload = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  const wh = new Webhook(normalizeSendEmailHookSecret(secretRaw));

  let body: SendEmailHookPayload;
  try {
    body = wh.verify(payload, headers) as SendEmailHookPayload;
  } catch {
    return { ok: false, status: 401, message: "Invalid send-email hook signature" };
  }

  const toEmail = body.user?.email?.trim();
  if (!toEmail || !body.email_data?.token_hash || !body.email_data.redirect_to || !body.email_data.email_action_type) {
    return { ok: false, status: 400, message: "Invalid send-email hook payload" };
  }

  try {
    await sendSupabaseAuthEmail({
      toEmail,
      emailData: {
        token_hash: body.email_data.token_hash,
        redirect_to: body.email_data.redirect_to,
        email_action_type: body.email_data.email_action_type,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send auth email";
    return { ok: false, status: 500, message };
  }

  return { ok: true };
}
