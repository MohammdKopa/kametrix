import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  // Map input types to appropriate mobile keyboard types
  const inputMode = type === "email" ? "email" :
                    type === "tel" ? "tel" :
                    type === "url" ? "url" :
                    type === "number" ? "numeric" :
                    type === "search" ? "search" : undefined;

  return (
    <input
      type={type}
      inputMode={inputMode}
      data-slot="input"
      className={cn(
        // Base styles with mobile-first sizing
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] outline-none",
        // Mobile-friendly height and padding (minimum 44px touch target)
        "h-11 sm:h-10 px-3 py-2.5 sm:py-2",
        // Font size 16px on mobile to prevent iOS zoom, smaller on desktop
        "text-base md:text-sm",
        // File input styling
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Focus state
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        // Error/invalid state
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Touch optimization
        "touch-manipulation",
        className
      )}
      {...props}
    />
  )
}

export { Input }
