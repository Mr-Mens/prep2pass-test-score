import type { Metadata } from "next";

import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

export const metadata: Metadata = {
  title: "Admin dashboard",
  description: "Internal admin tools for Pass Pilot.",
};

export default function AdminPage() {
  return <AdminDashboardView />;
}
