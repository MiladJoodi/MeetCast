import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border text-[0.8125rem] font-semibold tracking-[-0.01em] whitespace-nowrap transition-[color,background-color,border-color,opacity,transform] duration-100 outline-none select-none active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand text-brand-foreground hover:bg-brand-hover",
        outline:
          "border-border bg-transparent text-foreground hover:border-foreground/30 hover:bg-muted/50",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_8%)]",
        ghost:
          "border-transparent text-foreground hover:bg-muted/70",
        destructive:
          "border-danger/30 bg-transparent text-danger hover:bg-danger/10",
        link: "h-auto border-0 px-0 text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 rounded-[var(--radius)] px-3.5",
        xs: "h-7 rounded-[var(--radius)] px-2 text-xs",
        sm: "h-8 rounded-[var(--radius)] px-3 text-[0.75rem]",
        lg: "h-10 rounded-[var(--radius)] px-4 text-[0.875rem]",
        icon: "size-9 rounded-[var(--radius)]",
        "icon-xs": "size-7 rounded-[var(--radius)] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-[var(--radius)]",
        "icon-lg": "size-10 rounded-[var(--radius)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
