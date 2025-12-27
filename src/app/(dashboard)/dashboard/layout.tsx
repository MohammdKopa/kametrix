import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { NavTabs } from '@/components/dashboard/nav-tabs';
import { UserMenu } from '@/components/dashboard/user-menu';
import { ThemeToggle } from '@/components/dashboard/theme-toggle';
import { Activity } from 'lucide-react';

export default async function DashboardNestedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-[var(--background-secondary)] border-b border-gray-200 dark:border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-900 dark:bg-gradient-to-br dark:from-[var(--accent)] dark:to-[var(--accent-secondary)] rounded-lg shadow-sm">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-[var(--foreground)]">Kametrix</h1>
            </div>

            {/* Theme Toggle & User Menu */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserMenu user={user} />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-[var(--background-secondary)] border-b border-gray-200 dark:border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-8">
          <NavTabs />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}
