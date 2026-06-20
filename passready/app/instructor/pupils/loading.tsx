import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function InstructorPupilsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={4} />
    </div>
  );
}
