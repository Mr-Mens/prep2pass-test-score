import { redirect } from "next/navigation";

/** Alias for report library (preserves /my-reports). */
export default function ReportsIndexPage() {
  redirect("/my-reports");
}
