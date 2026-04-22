import type { Metadata } from "next";

import { ReportLookupForm } from "@/components/ReportLookupForm";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Find My Report",
  description: "Request a secure magic link to access your saved Premium TestReady Score Reports.",
};

export default function ReportLookupPage() {
  return (
    <Section
      className="bg-brand-50"
      contentClassName="max-w-3xl"
      eyebrow="Find My Report"
      title="Open a saved report"
      subtitle="Use the email from checkout and we will send a secure access link to your inbox."
    >
      <ReportLookupForm />
    </Section>
  );
}
