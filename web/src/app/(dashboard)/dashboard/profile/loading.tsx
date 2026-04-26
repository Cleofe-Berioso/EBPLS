import { CardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-32 animate-pulse rounded-md bg-[var(--border)]" />
        <div className="h-4 w-60 animate-pulse rounded-md bg-[var(--border)]" />
      </div>
      <div className="grid gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
