import { GridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page py-6 sm:py-10">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-4 w-80" />
      <Skeleton className="mt-6 h-14 w-full rounded-2xl" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <Skeleton className="hidden h-[600px] rounded-2xl lg:block" />
        <div>
          <Skeleton className="mb-4 h-9 w-full" />
          <GridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}
