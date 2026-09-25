"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

import { isDarkMarketingPath } from "@/lib/layout/marketing-paths";

const CANVAS_CLASS = "mc-dark-canvas";

/**
 * Keeps the document canvas dark on marketing routes so the light body
 * background never shows as a white strip under docs/plans/auth pages.
 */
export function MarketingCanvasSync() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const dark = isDarkMarketingPath(pathname);
    root.classList.toggle(CANVAS_CLASS, dark);
    return () => {
      root.classList.remove(CANVAS_CLASS);
    };
  }, [pathname]);

  return null;
}
