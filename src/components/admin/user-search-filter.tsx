"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const statusFilters = [
  { value: "all", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "locked", label: "Verrouillés" },
  { value: "suspended", label: "Suspendus" },
];

export function UserSearchFilter({
  currentQuery,
  currentStatus,
}: {
  currentQuery: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(currentQuery);

  const updateUrl = useCallback(
    (q: string, status: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status && status !== "all") params.set("status", status);
      router.push(`/admin/users?${params.toString()}`);
    },
    [router]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateUrl(query, currentStatus);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, e-mail ou numéro de compte..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
        />
      </form>

      {/* Status Filter */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => updateUrl(query, f.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              currentStatus === f.value
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
