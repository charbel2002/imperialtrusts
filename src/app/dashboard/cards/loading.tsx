import { StatsRowSkeleton, GridSkeleton } from "@/components/ui/loaders";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
        <div className="space-y-2"><div className="h-5 bg-slate-200 rounded w-32 animate-pulse" /><div className="h-3 bg-slate-100 rounded w-20 animate-pulse" /></div>
      </div>
      <StatsRowSkeleton count={3} />
      <GridSkeleton count={3} />
    </div>
  );
}
