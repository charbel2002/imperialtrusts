import { TableSkeleton, StatsRowSkeleton } from "@/components/ui/loaders";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-slate-200" />
        <div className="space-y-2"><div className="h-5 bg-slate-200 rounded w-44" /><div className="h-3 bg-slate-100 rounded w-28" /></div>
      </div>
      <StatsRowSkeleton count={4} />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
