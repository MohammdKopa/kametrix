'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  title?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  delayDuration?: number;
  className?: string;
}

export function Tooltip({
  children,
  content,
  title,
  side = 'top',
  sideOffset = 4,
  delayDuration = 200,
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={sideOffset}
            className={cn(
              'z-[100] max-w-xs rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md',
              'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
              className
            )}
          >
            {title && (
              <p className="font-semibold text-foreground mb-1">{title}</p>
            )}
            <p className="text-muted-foreground">{content}</p>
            <TooltipPrimitive.Arrow className="fill-popover" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

interface HelpTooltipProps {
  content: React.ReactNode;
  title?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  iconClassName?: string;
}

export function HelpTooltip({
  content,
  title,
  side = 'top',
  className,
  iconClassName,
}: HelpTooltipProps) {
  return (
    <Tooltip content={content} title={title} side={side} className={className}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-full p-0.5',
          'text-muted-foreground hover:text-foreground hover:bg-muted',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'transition-colors duration-200',
          iconClassName
        )}
        aria-label="Hilfe anzeigen"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
    </Tooltip>
  );
}

// Export provider for app-wide tooltip usage
export const TooltipProvider = TooltipPrimitive.Provider;
