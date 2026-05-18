import { requireAuthenticatedSession } from "@/lib/server/require-authenticated-session";

export default async function ProgressLayout({ children }: { children: React.ReactNode }) {
  await requireAuthenticatedSession("/progress");
  return <>{children}</>;
}
