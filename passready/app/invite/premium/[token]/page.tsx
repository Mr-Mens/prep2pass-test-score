import type { Metadata } from "next";

import { PremiumInviteLanding } from "@/components/invite/PremiumInviteLanding";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Premium invite · Pass Pilot",
  description: "Accept your Pass Pilot premium learner invite.",
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function PremiumInvitePage({ params }: PageProps) {
  const { token } = await params;

  return (
    <Section
      className="bg-brand-50"
      contentClassName="max-w-3xl"
      eyebrow="Pass Pilot"
      title="Premium learner invite"
      subtitle="Create your account with the email this invite was sent to, then subscribe with your discount applied."
    >
      <PremiumInviteLanding token={token} />
    </Section>
  );
}
