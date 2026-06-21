/**
 * Send a Pass Pilot test email via the local dev API route.
 * Usage: npm run test:email -- you@example.com
 * Requires: npm run dev and RESEND_API_KEY + EMAIL_FROM in .env.local
 */
const to = process.argv[2]?.trim();
if (!to) {
  console.error("Usage: npm run test:email -- you@example.com");
  process.exit(1);
}

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

async function main() {
  const response = await fetch(`${baseUrl}/api/dev/test-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to }),
  });
  const payload = (await response.json()) as { ok?: boolean; error?: string; result?: unknown };
  if (!response.ok) {
    console.error(payload.error ?? "Test email failed");
    process.exit(1);
  }
  console.log("Test email result:", payload.result ?? payload);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
