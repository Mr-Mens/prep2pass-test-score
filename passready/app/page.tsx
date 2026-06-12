import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MarketingHomePage } from "@/components/marketing/MarketingHomePage";
import { redirectIfAuthenticated } from "@/lib/server/redirect-if-authenticated";

export const metadata: Metadata = {
  title: "Test Ready Score by Prep2Pass",
  description:
    "Test Ready Score: a clear UK learner assessment with practical risks and focused next steps before your practical test. Created by a DVSA-approved driving instructor.",
};

export default async function HomePage() {
  await redirectIfAuthenticated();
  return <MarketingHomePage />;
}
