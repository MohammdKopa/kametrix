'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, Phone, Coins, Settings, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Tab {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

const tabs: Tab[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'View dashboard overview' },
  { name: 'Agents', href: '/dashboard/agents', icon: Bot, description: 'Manage voice agents' },
  { name: 'Calls', href: '/dashboard/calls', icon: Phone, description: 'View call history' },
  { name: 'Credits', href: '/dashboard/credits', icon: Coins, description: 'Manage credits and billing' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, description: 'Configure settings' },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <div className="-mb-px" role="tablist" aria-label="Dashboard navigation">
      {/* Mobile-scrollable navigation with hidden scrollbar */}
      <div className="nav-scroll-mobile md:flex md:gap-1 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 md:mx-0 md:px-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          // Check if pathname starts with tab href (for nested routes) or exact match for dashboard
          const isActive = tab.href === '/dashboard'
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Button
              key={tab.href}
              variant="ghost"
              asChild
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              className={`
                relative flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 h-auto min-h-[44px]
                rounded-t-lg rounded-b-none transition-all duration-150
                text-sm sm:text-base
                ${
                  isActive
                    ? 'bg-primary/10 text-primary hover:bg-primary/15 border-l-2 border-l-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              <Link
                href={tab.href}
                aria-label={`${tab.name}: ${tab.description}`}
                className="flex items-center gap-1.5 sm:gap-2"
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} aria-hidden="true" />
                <span className="whitespace-nowrap">{tab.name}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full"
                    aria-hidden="true"
                  />
                )}
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
