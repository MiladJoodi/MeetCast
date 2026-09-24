"use client";

import { cn } from "@/lib/utils";

export type RoomVisibilityValue = "public" | "private";

type RoomVisibilityFieldProps = {
  value: RoomVisibilityValue;
  onChange: (value: RoomVisibilityValue) => void;
  disabled?: boolean;
  error?: string;
};

const OPTIONS: { value: RoomVisibilityValue; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

export function RoomVisibilityField({
  value,
  onChange,
  disabled,
  error,
}: RoomVisibilityFieldProps) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-xs text-muted-foreground">Access</legend>
      <div className="flex gap-2">
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "h-9 flex-1 rounded-md border text-sm transition-colors",
                selected
                  ? "border-brand bg-brand-soft font-medium text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <input type="hidden" name="visibility" value={value} />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </fieldset>
  );
}
