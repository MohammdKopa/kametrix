'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, Phone, Coins, Settings, type LucideIcon } from 'lucide-react';

interface Tab {
  name: string;
  href: string;
  icon: LucideIcon;
}

const tabs: Tab[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'Calls', href: '/dashboard/calls', icon: Phone },
  { name: 'Credits', href: '/dashboard/credits', icon: Coins },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="-mb-px">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          // Check if pathname starts with tab href (for nested routes) or exact match for dashboard
          const isActive = tab.href === '/dashboard'
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                relative flex items-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-150
                ${
                  isActive
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
                rounded-t-lg
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
              {tab.name}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
