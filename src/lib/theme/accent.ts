export const ACCENT_STORAGE_KEY = "meetcast-accent";

/** Distinct accent themes — not a single green spectrum. */
export const ACCENT_IDS = [
  "forest",
  "ocean",
  "violet",
  "rose",
  "amber",
  "slate",
] as const;

export type AccentId = (typeof ACCENT_IDS)[number];

export type AccentOption = {
  id: AccentId;
  label: string;
  /** Swatch in the picker (light-mode brand). */
  swatch: string;
};

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: "forest", label: "Forest", swatch: "oklch(0.42 0.1 155)" },
  { id: "ocean", label: "Ocean", swatch: "oklch(0.48 0.14 245)" },
  { id: "violet", label: "Violet", swatch: "oklch(0.46 0.16 300)" },
  { id: "rose", label: "Rose", swatch: "oklch(0.52 0.16 12)" },
  { id: "amber", label: "Amber", swatch: "oklch(0.52 0.15 58)" },
  { id: "slate", label: "Slate", swatch: "oklch(0.4 0.05 255)" },
];

export function isAccentId(value: string | null | undefined): value is AccentId {
  return (
    typeof value === "string" &&
    (ACCENT_IDS as readonly string[]).includes(value)
  );
}

export function readStoredAccent(): AccentId {
  if (typeof window === "undefined") return "forest";
  try {
    const raw = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    return isAccentId(raw) ? raw : "forest";
  } catch {
    return "forest";
  }
}

export function applyAccent(accent: AccentId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-accent", accent);
}

export function persistAccent(accent: AccentId) {
  applyAccent(accent);
  try {
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  } catch {
    // Ignore quota / private mode failures.
  }
}
