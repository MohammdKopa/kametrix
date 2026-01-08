import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles
        "border-input placeholder:text-muted-foreground dark:bg-input/30",
        "flex field-sizing-content w-full rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] outline-none",
        // Mobile-friendly sizing (minimum height for comfortable touch)
        "min-h-[100px] sm:min-h-16 px-3 py-3 sm:py-2",
        // Font size 16px on mobile to prevent iOS zoom, smaller on desktop
        "text-base md:text-sm",
        // Focus state
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        // Error/invalid state
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Touch optimization
        "touch-manipulation resize-y",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
