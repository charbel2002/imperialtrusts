import { CardSkeleton } from "@/components/ui/loaders";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
        <div className="space-y-2"><div className="h-5 bg-slate-200 rounded w-40 animate-pulse" /><div className="h-3 bg-slate-100 rounded w-48 animate-pulse" /></div>
      </div>
      <CardSkeleton lines={6} />
    </div>
  );
}
