import { ListSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page max-w-3xl py-6 sm:py-10">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mb-6 mt-3 h-4 w-80" />
      <ListSkeleton rows={6} />
    </div>
  );
}
