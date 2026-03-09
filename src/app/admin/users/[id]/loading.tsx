import { CardSkeleton, StatsRowSkeleton } from "@/components/ui/loaders";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-slate-200" />
        <div className="space-y-2"><div className="h-5 bg-slate-200 rounded w-36" /><div className="h-3 bg-slate-100 rounded w-48" /></div>
      </div>
      <StatsRowSkeleton count={3} />
      <CardSkeleton lines={5} />
      <CardSkeleton lines={4} />
    </div>
  );
}
