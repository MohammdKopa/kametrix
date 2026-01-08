import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        // Base card styles
        "bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm",
        // Responsive gap and padding
        "gap-4 sm:gap-5 md:gap-6 py-4 sm:py-5 md:py-6",
        // Mobile-optimized border radius
        "rounded-lg sm:rounded-xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 sm:gap-2",
        // Responsive horizontal padding
        "px-4 sm:px-5 md:px-6",
        // Card action grid layout
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        // Border bottom padding
        "[.border-b]:pb-4 sm:[.border-b]:pb-5 md:[.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        // Responsive horizontal padding
        "px-4 sm:px-5 md:px-6",
        className
      )}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center",
        // Responsive horizontal padding
        "px-4 sm:px-5 md:px-6",
        // Border top padding
        "[.border-t]:pt-4 sm:[.border-t]:pt-5 md:[.border-t]:pt-6",
        // Stack on mobile for action buttons
        "flex-col sm:flex-row gap-3 sm:gap-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
