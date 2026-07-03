import dynamic from "next/dynamic";

import { MockTestFormSkeleton } from "@/components/ui/skeleton";

const InstructorMockTestForm = dynamic(
  () =>
    import("@/components/instructor/InstructorMockTestForm").then((mod) => ({
      default: mod.InstructorMockTestForm,
    })),
  { loading: () => <MockTestFormSkeleton /> },
);

export default function InstructorNewMockTestPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const raw = searchParams?.id;
  const id = typeof raw === "string" && raw.length > 0 ? raw : undefined;
  const cabRaw = searchParams?.cab;
  const autoStartCab = cabRaw === "1" || cabRaw === "true";
  return <InstructorMockTestForm initialMockTestId={id} autoStartCab={autoStartCab} />;
}
