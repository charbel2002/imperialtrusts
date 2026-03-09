import { CardSkeleton } from "@/components/ui/loaders";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
        <div className="space-y-2"><div className="h-5 bg-slate-200 rounded w-36 animate-pulse" /><div className="h-3 bg-slate-100 rounded w-24 animate-pulse" /></div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} lines={2} />
        ))}
      </div>
    </div>
  );
}
