import { requireAuthenticatedSession } from "@/lib/server/require-authenticated-session";

export default async function MockTestsLayout({ children }: { children: React.ReactNode }) {
  await requireAuthenticatedSession("/mock-tests");
  return <>{children}</>;
}
