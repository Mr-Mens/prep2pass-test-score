import { requirePremiumLearnerAccess } from "@/lib/server/require-premium-learner-access";

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  await requirePremiumLearnerAccess("/my-reports");
  return <>{children}</>;
}
