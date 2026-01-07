'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId: string;
  children?: React.ReactNode;
}

/**
 * Skip Navigation Link Component
 *
 * Allows keyboard users to skip directly to the main content.
 * Implements WCAG 2.1 Success Criterion 2.4.1 Bypass Blocks (Level A)
 */
export function SkipLink({
  targetId,
  children = 'Skip to main content',
  className,
  ...props
}: SkipLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      // Make the target focusable temporarily
      target.setAttribute('tabindex', '-1');
      target.focus();
      // Remove tabindex after focus to maintain natural tab order
      target.addEventListener(
        'blur',
        () => {
          target.removeAttribute('tabindex');
        },
        { once: true }
      );
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        // Visually hidden by default
        'absolute -top-full left-0 z-[9999]',
        // Visible when focused
        'focus:top-0 focus:left-0 focus:p-4',
        'bg-primary text-primary-foreground',
        'font-medium text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}

/**
 * Skip Links Container Component
 *
 * Use this to add multiple skip links for complex page layouts
 */
interface SkipLinksProps {
  links: Array<{
    targetId: string;
    label: string;
  }>;
  className?: string;
}

export function SkipLinks({ links, className }: SkipLinksProps) {
  return (
    <div className={cn('skip-links-container', className)}>
      {links.map(({ targetId, label }) => (
        <SkipLink key={targetId} targetId={targetId}>
          {label}
        </SkipLink>
      ))}
    </div>
  );
}
