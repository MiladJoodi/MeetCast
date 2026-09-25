"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  language?: string;
  className?: string;
};

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const trimmed = code.replace(/^\n+|\n+$/g, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(trimmed);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={cn(
        "mc-mkt-panel group relative overflow-hidden rounded-xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5">
        <span className="flex items-center gap-2 text-[0.6875rem] font-medium tracking-wide text-white/45 uppercase">
          <span className="mc-mkt-live scale-75" aria-hidden />
          {language ?? "code"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="h-7 gap-1.5 text-white/55 hover:bg-white/10 hover:text-white"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <CheckIcon className="size-3.5" aria-hidden />
          ) : (
            <CopyIcon className="size-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 text-[0.8125rem] leading-relaxed text-white/85">
        <code>{trimmed}</code>
      </pre>
    </div>
  );
}
