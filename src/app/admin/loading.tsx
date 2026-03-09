import { StatsRowSkeleton, TableSkeleton } from "@/components/ui/loaders";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
        <div className="space-y-2"><div className="h-5 bg-slate-200 rounded w-44 animate-pulse" /><div className="h-3 bg-slate-100 rounded w-36 animate-pulse" /></div>
      </div>
      <StatsRowSkeleton count={4} />
      <StatsRowSkeleton count={4} />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 rounded-xl border border-slate-200 bg-white animate-pulse" />
        <div className="h-80 rounded-xl border border-slate-200 bg-white animate-pulse" />
      </div>
    </div>
  );
}
