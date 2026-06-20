import type { ReactNode } from "react";

type SkeletonProps = {
  className?: string;
};

/** Soft shimmer block for route-level loading states. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-xl bg-gradient-to-r from-brand-100/90 via-brand-50/80 to-brand-100/90 ${className}`}
    />
  );
}

export function SkeletonCard({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6 ${className}`}>{children}</div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-56 max-w-full" />
      <Skeleton className="h-4 w-full max-w-xl" />
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <SkeletonCard>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Skeleton className="h-40 w-40 shrink-0 rounded-full" />
          <div className="w-full flex-1 space-y-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
      </SkeletonCard>
      <div className="grid gap-4 sm:grid-cols-2">
        <SkeletonCard className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-16 w-full" />
        </SkeletonCard>
        <SkeletonCard className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-16 w-full" />
        </SkeletonCard>
      </div>
      <SkeletonCard className="space-y-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </SkeletonCard>
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </SkeletonCard>
      ))}
    </div>
  );
}

export function ReportDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-24">
      <SkeletonCard className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </SkeletonCard>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-20 w-full" />
        </SkeletonCard>
      ))}
    </div>
  );
}

export function AccountPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonCard key={i} className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </SkeletonCard>
      ))}
    </div>
  );
}

export function InstructorTilesSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="min-h-[180px] space-y-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-24" />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

export function MockTestFormSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <SkeletonCard className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </SkeletonCard>
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((__, j) => (
              <Skeleton key={j} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

export function DiagramLibrarySkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-20" />
          </SkeletonCard>
        ))}
      </div>
      <SkeletonCard className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </SkeletonCard>
      <CardGridSkeleton count={6} />
    </div>
  );
}
