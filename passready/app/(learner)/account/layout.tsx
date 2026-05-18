import { requireAuthenticatedSession } from "@/lib/server/require-authenticated-session";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireAuthenticatedSession("/account");
  return <>{children}</>;
}
