import type { Metadata } from "next";

import { ReportLookupForm } from "@/components/ReportLookupForm";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Find My Report",
  description:
    "Find your saved Premium TestReady Score Reports. Enter the email you used at checkout.",
};

export default function ReportLookupPage() {
  return (
    <Section
      className="bg-brand-50"
      contentClassName="max-w-3xl"
      eyebrow="Find My Report"
      title="Open a saved report"
      subtitle="Use the email from checkout. We list your recent Premium TestReady Score Reports with links to each full report."
    >
      <ReportLookupForm />
    </Section>
  );
}
