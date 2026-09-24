"use client";

import { useEffect, useState } from "react";

import {
  ACCENT_OPTIONS,
  applyAccent,
  persistAccent,
  readStoredAccent,
  type AccentId,
} from "@/lib/theme/accent";
import { cn } from "@/lib/utils";

export function AccentPalettePicker() {
  const [accent, setAccent] = useState<AccentId>("forest");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = readStoredAccent();
    setAccent(current);
    applyAccent(current);
    setMounted(true);
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Accent color</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes buttons, surfaces, and fog in both light and dark mode.
        </p>
      </div>
      <div
        className="flex flex-wrap gap-2.5"
        role="radiogroup"
        aria-label="Accent color"
      >
        {ACCENT_OPTIONS.map((option) => {
          const selected = mounted && accent === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              title={option.label}
              disabled={!mounted}
              onClick={() => {
                setAccent(option.id);
                persistAccent(option.id);
              }}
              className={cn(
                "flex size-10 items-center justify-center rounded-full border-2 transition-[border-color,transform] duration-150",
                selected
                  ? "border-foreground scale-105"
                  : "border-transparent hover:border-border",
              )}
            >
              <span
                className="size-7 rounded-full shadow-inner ring-1 ring-black/10 dark:ring-white/15"
                style={{ backgroundColor: option.swatch }}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
      {mounted ? (
        <p className="text-xs text-muted-foreground">
          Selected:{" "}
          <span className="font-medium text-foreground">
            {ACCENT_OPTIONS.find((option) => option.id === accent)?.label}
          </span>
        </p>
      ) : null}
    </div>
  );
}
