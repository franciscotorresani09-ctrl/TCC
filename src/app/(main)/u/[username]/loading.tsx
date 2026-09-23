import { ProfileSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page py-6 sm:py-10">
      <ProfileSkeleton />
    </div>
  );
}
