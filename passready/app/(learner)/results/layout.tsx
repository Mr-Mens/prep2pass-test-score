import { requirePremiumLearnerAccess } from "@/lib/server/require-premium-learner-access";

export default async function ResultsLayout({ children }: { children: React.ReactNode }) {
  await requirePremiumLearnerAccess("/results");
  return <>{children}</>;
}
