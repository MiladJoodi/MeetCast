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
        "group relative overflow-hidden rounded-lg border border-border bg-muted/40",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <span className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
          {language ?? "code"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="h-7 gap-1.5 text-muted-foreground"
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
      <pre className="overflow-x-auto p-3 text-[0.8125rem] leading-relaxed">
        <code>{trimmed}</code>
      </pre>
    </div>
  );
}
