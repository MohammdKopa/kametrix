'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Agents', href: '/dashboard/agents' },
  { name: 'Calls', href: '/dashboard/calls' },
  { name: 'Settings', href: '/dashboard/settings' },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200">
      <div className="flex gap-8">
        {tabs.map((tab) => {
          // Check if pathname starts with tab href (for nested routes) or exact match for dashboard
          const isActive = tab.href === '/dashboard'
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                py-4 px-1 border-b-2 text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
