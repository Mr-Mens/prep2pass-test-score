import type { Metadata } from "next";

import { Section } from "@/components/Section";
import { UpgradeFlow } from "@/components/UpgradeFlow";

export const metadata: Metadata = {
  title: "Upgrade to lifetime · Prep2Pass",
  description:
    "One-time upgrade for unlimited Premium TestReady reports and a private progress timeline tied to your email.",
};

export default function UpgradePage() {
  return (
    <Section className="max-md:bg-transparent bg-brand-50" contentClassName="max-w-2xl">
      <UpgradeFlow />
    </Section>
  );
}
