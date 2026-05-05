import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-5 gap-4 rounded-xl border border-slate-100 bg-white/80 p-4 shadow-soft"
        >
          <Skeleton className="h-4 w-44 rounded-lg bg-slate-100" />
          <Skeleton className="h-4 w-24 rounded-lg bg-slate-100" />
          <Skeleton className="h-4 w-24 rounded-lg bg-slate-100" />
          <Skeleton className="h-4 w-24 rounded-lg bg-slate-100" />
          <Skeleton className="h-4 w-28 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function CriteriaSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-100 bg-white/80 p-5 shadow-soft"
        >
          <Skeleton className="mb-3 h-5 w-3/4 rounded-lg bg-slate-100" />
          <Skeleton className="h-4 w-1/2 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
