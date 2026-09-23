import { GridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page py-6 sm:py-10">
      <Skeleton className="mb-8 h-56 w-full rounded-3xl" />
      <Skeleton className="mb-6 h-12 w-full max-w-xl rounded-2xl" />
      <GridSkeleton kind="event" count={6} />
    </div>
  );
}
