'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'Users', href: '/admin' },
  { name: 'Agents', href: '/admin/agents' },
  { name: 'Phone Numbers', href: '/admin/phone-numbers' },
];

export function AdminNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200">
      <div className="flex gap-8">
        {tabs.map((tab) => {
          const isActive = tab.href === '/admin'
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
                    ? 'border-purple-600 text-purple-600'
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
