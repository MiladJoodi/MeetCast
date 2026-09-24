"use client";

import { useEffect } from "react";

import { applyAccent, readStoredAccent } from "@/lib/theme/accent";

/** Keeps html[data-accent] in sync after hydration (pairs with inline boot script). */
export function AccentProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyAccent(readStoredAccent());
  }, []);

  return children;
}
