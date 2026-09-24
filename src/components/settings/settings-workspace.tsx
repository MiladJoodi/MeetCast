"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SettingsSection = {
  id: string;
  label: string;
  content: ReactNode;
};

type SettingsWorkspaceProps = {
  sections: SettingsSection[];
};

export function SettingsWorkspace({ sections }: SettingsWorkspaceProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const active = sections.find((section) => section.id === activeId) ?? sections[0];

  if (!active) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-10">
      <nav aria-label="Settings" className="lg:sticky lg:top-4 lg:self-start">
        <ul className="flex gap-1 overflow-x-auto border-b border-border pb-3 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-b-0 lg:border-l lg:pb-0">
          {sections.map((section) => {
            const isActive = section.id === active.id;
            return (
              <li key={section.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveId(section.id)}
                  className={cn(
                    "block w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors lg:-ml-px lg:rounded-none lg:border-l-2 lg:border-transparent lg:px-0 lg:pl-3",
                    isActive
                      ? "bg-muted/60 font-medium text-foreground lg:border-brand lg:bg-transparent"
                      : "text-muted-foreground hover:text-foreground lg:hover:border-brand/40",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {section.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 space-y-4">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">
          {active.label}
        </h2>
        {active.content}
      </div>
    </div>
  );
}
