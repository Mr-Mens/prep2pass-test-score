import type { Metadata } from "next";

import { UpgradeFlow } from "@/components/UpgradeFlow";

export const metadata: Metadata = {
  title: "Upgrade to lifetime · Prep2Pass",
  description:
    "One-time upgrade for unlimited Premium TestReady reports and a private progress timeline tied to your email.",
};

export default function UpgradePage() {
  return (
    <div className="pb-4">
      <UpgradeFlow />
    </div>
  );
}
