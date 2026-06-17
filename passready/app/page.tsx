import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MarketingHomePage } from "@/components/marketing/MarketingHomePage";
import { SITE_DEFAULT_DESCRIPTION } from "@/lib/constants";
import { redirectIfAuthenticated } from "@/lib/server/redirect-if-authenticated";

export const metadata: Metadata = {
  title: "Pass Pilot",
  description: SITE_DEFAULT_DESCRIPTION,
};

export default async function HomePage() {
  await redirectIfAuthenticated();
  return <MarketingHomePage />;
}
