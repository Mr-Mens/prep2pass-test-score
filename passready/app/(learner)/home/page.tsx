import { redirect } from "next/navigation";

import { redirectIfAuthenticated } from "@/lib/server/redirect-if-authenticated";

export default async function LearnerMarketingHomeRedirect() {
  await redirectIfAuthenticated();
  redirect("/");
}
