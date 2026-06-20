import { CardGridSkeleton, PageHeaderSkeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <SkeletonCard className="h-14" />
      <CardGridSkeleton count={3} />
    </div>
  );
}
