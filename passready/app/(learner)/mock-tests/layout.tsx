import { requirePremiumLearnerAccess } from "@/lib/server/require-premium-learner-access";

export default async function MockTestsLayout({ children }: { children: React.ReactNode }) {
  await requirePremiumLearnerAccess("/mock-tests");
  return <>{children}</>;
}
