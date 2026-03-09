"use client";

import { createContext, useContext, type ReactNode } from "react";

const DictContext = createContext<Record<string, any>>({});

export function DictProvider({ dict, children }: { dict: Record<string, any>; children: ReactNode }) {
  return <DictContext.Provider value={dict}>{children}</DictContext.Provider>;
}

export function useDict(): Record<string, any> {
  const dict = useContext(DictContext);
  if (!dict || Object.keys(dict).length === 0) {
    // Fallback - shouldn't happen but prevents crashes
    return {};
  }
  return dict;
}

/**
 * Hook to get a specific section of the dictionary.
 * Usage: const t = useDictSection("cards")
 */
export function useDictSection(section: string): Record<string, any> {
  const dict = useDict();
  return dict[section] || {};
}
