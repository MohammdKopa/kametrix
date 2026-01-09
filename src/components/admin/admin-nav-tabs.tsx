'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Bot, Phone, Settings, Activity, Monitor, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Tab {
  name: string;
  href: string;
  icon: LucideIcon;
}

const tabs: Tab[] = [
  { name: 'Users', href: '/admin', icon: Users },
  { name: 'Agents', href: '/admin/agents', icon: Bot },
  { name: 'Phone Numbers', href: '/admin/phone-numbers', icon: Phone },
  { name: 'System', href: '/admin/monitoring', icon: Activity },
  { name: 'Agent Monitor', href: '/admin/agent-monitoring', icon: Monitor },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="-mb-px">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.href === '/admin'
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Button
              key={tab.href}
              variant="ghost"
              asChild
              className={`
                relative flex items-center gap-2 py-3 px-4 h-auto rounded-t-lg rounded-b-none transition-all duration-150
                ${
                  isActive
                    ? 'bg-primary/10 text-primary hover:bg-primary/15 border-l-2 border-l-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              <Link href={tab.href}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                {tab.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full" />
                )}
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
