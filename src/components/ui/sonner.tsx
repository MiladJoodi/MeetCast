"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      gap={10}
      offset={16}
      visibleToasts={3}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast group-[.toaster]:border group-[.toaster]:border-border/80 group-[.toaster]:bg-surface-elevated group-[.toaster]:text-foreground group-[.toaster]:shadow-lg group-[.toaster]:shadow-black/5",
          title: "group-[.toast]:text-sm group-[.toast]:font-medium",
          description: "group-[.toast]:text-sm group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:border-success/30 group-[.toaster]:bg-success/10 group-[.toaster]:text-success",
          error:
            "group-[.toaster]:border-destructive/30 group-[.toaster]:bg-destructive/10 group-[.toaster]:text-destructive",
          warning:
            "group-[.toaster]:border-warning/30 group-[.toaster]:bg-warning/10 group-[.toaster]:text-warning",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
