import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-[var(--radius)] border border-input bg-surface-elevated px-3 py-1.5 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-brand focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
