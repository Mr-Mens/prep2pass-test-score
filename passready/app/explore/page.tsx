import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { redirectIfAuthenticated } from "@/lib/server/redirect-if-authenticated";

export const metadata: Metadata = {
  title: "Pass Pilot",
  description: "Explore Pass Pilot, UK learner test readiness assessment.",
};

/** Legacy marketing entry, canonical homepage is `/`. */
export default async function ExplorePage() {
  await redirectIfAuthenticated();
  redirect("/");
}
