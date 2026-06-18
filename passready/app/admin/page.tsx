import type { Metadata } from "next";

import { AdminDashboardView } from "@/components/admin/AdminDashboardView";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Admin dashboard",
  description: "Internal admin tools for Pass Pilot.",
};

export default function AdminPage() {
  return (
    <Section
      className="bg-brand-50"
      contentClassName="max-w-6xl"
      eyebrow="Internal admin"
      title="Pass Pilot admin"
      subtitle="Promo codes, premium invite links, and operational analytics."
    >
      <AdminDashboardView />
    </Section>
  );
}
