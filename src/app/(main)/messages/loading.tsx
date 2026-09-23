import { ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page py-6">
      <ListSkeleton rows={6} />
    </div>
  );
}
