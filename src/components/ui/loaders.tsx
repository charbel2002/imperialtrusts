import { cn } from "@/lib/utils";

// --- Skeleton Base ------------------------------------------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200/70", className)} />;
}

// --- Atom Loader (3-dot breathing animation) ----------------

export function AtomLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : size === "lg" ? "w-3 h-3" : "w-2 h-2";
  const gap = size === "sm" ? "gap-1" : size === "lg" ? "gap-2" : "gap-1.5";

  return (
    <div className={`flex items-center ${gap}`}>
      <div className={`${dotSize} rounded-full bg-primary atom-dot`} style={{ animationDelay: "0ms" }} />
      <div className={`${dotSize} rounded-full bg-secondary atom-dot`} style={{ animationDelay: "150ms" }} />
      <div className={`${dotSize} rounded-full bg-accent atom-dot`} style={{ animationDelay: "300ms" }} />
    </div>
  );
}

// --- Full Viewport Loader (for page transitions) ------------

export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Atom orbital animation */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" style={{ animationDuration: "1.2s" }} />
          <div className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-accent animate-spin" style={{ animationDuration: "1.8s", animationDirection: "reverse" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary atom-dot" />
          </div>
        </div>
        {message && <p className="text-sm text-slate-400">{message}</p>}
      </div>
    </div>
  );
}

// --- Inline Action Loader (for buttons/forms) ---------------

export function InlineLoader() {
  return <AtomLoader size="sm" />;
}

// ===========================================================
// PAGE-SPECIFIC SKELETONS
// ===========================================================

// --- Homepage Skeleton --------------------------------------

export function HomeSkeleton() {
  return (
    <div className="min-h-[calc(100vh-5rem)] animate-pulse">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="h-5 bg-accent/10 rounded-full w-48" />
            <div className="space-y-3">
              <div className="h-12 bg-slate-200 rounded-lg w-4/5" />
              <div className="h-12 bg-slate-200 rounded-lg w-3/5" />
              <div className="h-12 bg-slate-200/60 rounded-lg w-2/5" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-4/5" />
            </div>
            <div className="flex gap-4 pt-2">
              <div className="h-12 bg-primary/20 rounded-lg w-44" />
              <div className="h-12 bg-slate-200 rounded-lg w-36" />
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-full max-w-md mx-auto h-56 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300" />
          </div>
        </div>
      </div>
      {/* Features */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <div className="h-4 bg-accent/10 rounded w-40 mx-auto" />
            <div className="h-8 bg-slate-200 rounded-lg w-80 mx-auto" />
            <div className="h-4 bg-slate-100 rounded w-96 mx-auto" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 p-7 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200" />
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Services Page Skeleton ---------------------------------

export function ServicesSkeleton() {
  return (
    <div className="min-h-[calc(100vh-5rem)] animate-pulse">
      <div className="pt-16 pb-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center space-y-4">
          <div className="h-4 bg-secondary/10 rounded w-28 mx-auto" />
          <div className="h-10 bg-slate-200 rounded-lg w-96 mx-auto" />
          <div className="h-4 bg-slate-100 rounded w-80 mx-auto" />
        </div>
      </div>
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-24">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid lg:grid-cols-2 gap-16 items-center">
              <div className={`space-y-4 ${i % 2 === 1 ? "order-2" : ""}`}>
                <div className="h-5 bg-blue-50 rounded-full w-24" />
                <div className="h-8 bg-slate-200 rounded-lg w-3/4" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                  <div className="h-3 bg-slate-100 rounded w-4/6" />
                </div>
                <div className="space-y-3 pt-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded bg-accent/10" />
                      <div className="h-3 bg-slate-100 rounded flex-1" />
                    </div>
                  ))}
                </div>
              </div>
              <div className={`h-64 rounded-2xl bg-slate-200 ${i % 2 === 1 ? "order-1" : ""}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Content Page Skeleton (about, contact, legal, etc.) ----

export function ContentPageSkeleton() {
  return (
    <div className="min-h-[calc(100vh-5rem)] animate-pulse">
      <div className="pt-16 pb-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center space-y-4">
          <div className="h-4 bg-accent/10 rounded w-32 mx-auto" />
          <div className="h-10 bg-slate-200 rounded-lg w-72 mx-auto" />
          <div className="h-4 bg-slate-100 rounded w-96 mx-auto" />
        </div>
      </div>
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-16">
          <div className="space-y-6">
            <div className="h-6 bg-slate-200 rounded w-48" />
            <div className="space-y-3">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
              <div className="h-3 bg-slate-100 rounded w-4/6" />
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-64 rounded-xl border border-slate-200 bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Auth Skeleton ------------------------------------------

export function AuthSkeleton() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 animate-pulse">
        <div className="space-y-3">
          <div className="h-7 bg-slate-200 rounded w-48" />
          <div className="h-4 bg-slate-100 rounded w-64" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2"><div className="h-3 bg-slate-200 rounded w-24" /><div className="h-11 bg-slate-100 rounded-lg" /></div>
          <div className="space-y-2"><div className="h-3 bg-slate-200 rounded w-20" /><div className="h-11 bg-slate-100 rounded-lg" /></div>
          <div className="h-11 bg-primary/20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// DASHBOARD & ADMIN SKELETONS (kept from before)
// ===========================================================

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200/70" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200/70 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-1/4" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-slate-100 rounded" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-pulse">
      <div className="bg-slate-50 px-6 py-3 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200/70 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-6 py-4 flex gap-6 border-t border-slate-50">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 bg-slate-100 rounded flex-1" style={{ opacity: 1 - r * 0.1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="h-3 bg-slate-200/70 rounded w-1/2 mb-3" />
          <div className="h-6 bg-slate-200/70 rounded w-2/3" />
          <div className="h-2 bg-slate-100 rounded w-1/3 mt-2" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 rounded-xl bg-gradient-to-br from-slate-200/80 to-slate-300/60 h-44" />
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 h-20" />
          <div className="rounded-xl border border-slate-200 bg-white p-5 h-20" />
          <div className="rounded-xl border border-slate-200 bg-white p-5 h-20" />
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="px-6 py-4 border-b border-slate-100"><div className="h-4 bg-slate-200/70 rounded w-40" /></div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between border-t border-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200/70" />
              <div className="space-y-2"><div className="h-3 bg-slate-200/70 rounded w-24" /><div className="h-2 bg-slate-100 rounded w-16" /></div>
            </div>
            <div className="h-4 bg-slate-200/70 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200/70" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200/70 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}
