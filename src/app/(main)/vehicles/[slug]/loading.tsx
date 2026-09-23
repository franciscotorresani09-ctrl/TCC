import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_380px]" role="status" aria-label="Loading listing">
      <div>
        <Skeleton className="aspect-[16/10] w-full rounded-3xl" />
        <div className="mt-3 flex gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-8 h-6 w-40" />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  );
}
