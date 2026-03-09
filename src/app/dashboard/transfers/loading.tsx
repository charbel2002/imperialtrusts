import { CardSkeleton } from "@/components/ui/loaders";

export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
        <div className="space-y-2"><div className="h-5 bg-slate-200 rounded w-32 animate-pulse" /><div className="h-3 bg-slate-100 rounded w-48 animate-pulse" /></div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 animate-pulse">
        <div className="h-24 rounded-xl bg-gradient-to-r from-slate-200 to-slate-300" />
        <div className="space-y-3">
          <div className="h-16 rounded-xl bg-slate-100 border border-slate-200" />
          <div className="h-16 rounded-xl bg-slate-100 border border-slate-200" />
          <div className="h-16 rounded-xl bg-slate-100 border border-slate-200" />
        </div>
        <div className="h-12 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}
