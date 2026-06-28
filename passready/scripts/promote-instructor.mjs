#!/usr/bin/env node
/**
 * Promote an auth user to instructor role.
 * Usage: node scripts/promote-instructor.mjs user@example.com
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal();

const emailArg = process.argv[2]?.trim().toLowerCase();
if (!emailArg) {
  console.error("Usage: node scripts/promote-instructor.mjs user@example.com");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(email) {
  let page = 1;
  const perPage = 200;
  while (page <= 50) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.trim().toLowerCase() === email);
    if (match) return match;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function main() {
  const user = await findUserIdByEmail(emailArg);
  if (!user) {
    console.error(`No auth user found for ${emailArg}`);
    process.exit(1);
  }

  const now = new Date().toISOString();
  console.log(`Promoting ${user.email} (${user.id}) to instructor…`);

  const { error: roleError } = await supabase.from("user_app_profiles").upsert(
    { user_id: user.id, role: "instructor", updated_at: now },
    { onConflict: "user_id" },
  );
  if (roleError) throw roleError;

  const { error: instructorError } = await supabase.from("instructor_profiles").upsert(
    { user_id: user.id, updated_at: now },
    { onConflict: "user_id" },
  );
  if (instructorError) throw instructorError;

  console.log("Done. User should sign out and back in, or refresh, to open the instructor workspace.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
