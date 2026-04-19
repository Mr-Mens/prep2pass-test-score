import type { Metadata } from "next";

import { AdminAnalyticsView } from "@/components/AdminAnalyticsView";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Admin analytics",
  description: "Internal operational analytics for Prep2Pass.",
};

export default function AdminPage() {
  return (
    <Section
      className="bg-brand-50"
      contentClassName="max-w-6xl"
      eyebrow="Internal admin"
      title="Prep2Pass analytics"
      subtitle="Temporary environment-key gate for local/dev operations until proper auth is added."
    >
      <AdminAnalyticsView />
    </Section>
  );
}
