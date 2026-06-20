import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function MyReportsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={4} />
    </div>
  );
}
