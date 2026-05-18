import { requireAuthenticatedSession } from "@/lib/server/require-authenticated-session";

export default async function MyReportsLayout({ children }: { children: React.ReactNode }) {
  await requireAuthenticatedSession("/my-reports");
  return <>{children}</>;
}
