import type { Metadata } from "next";

import { ResultsView } from "@/components/ResultsView";

export const metadata: Metadata = {
  title: "Your Premium TestReady Score Report",
  description:
    "Your Premium TestReady Score Report from Prep2Pass: score, risks, and next steps from your latest assessment.",
};

export default function ResultsPage() {
  return <ResultsView />;
}
