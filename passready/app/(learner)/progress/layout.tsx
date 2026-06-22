import { requirePremiumLearnerAccess } from "@/lib/server/require-premium-learner-access";

export default async function ProgressLayout({ children }: { children: React.ReactNode }) {
  await requirePremiumLearnerAccess("/progress");
  return <>{children}</>;
}
