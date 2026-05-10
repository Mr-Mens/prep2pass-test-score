import { InstructorMockTestForm } from "@/components/instructor/InstructorMockTestForm";

export default function InstructorNewMockTestPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const raw = searchParams?.id;
  const id = typeof raw === "string" && raw.length > 0 ? raw : undefined;
  return <InstructorMockTestForm initialMockTestId={id} />;
}
