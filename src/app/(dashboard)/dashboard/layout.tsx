import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { NavTabs } from '@/components/dashboard/nav-tabs';
import { UserMenu } from '@/components/dashboard/user-menu';
import { ThemeToggle } from '@/components/dashboard/theme-toggle';
import { SkipLink } from '@/components/ui/skip-link';
import { Activity } from 'lucide-react';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

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
    <div className="relative min-h-screen bg-background">
      {/* Skip Navigation Link for keyboard users - WCAG 2.4.1 */}
      <SkipLink targetId="main-content">
        Skip to main content
      </SkipLink>

      {/* Ambient glow effect */}
      <div className="glow-accent" aria-hidden="true" />

      {/* Header with glassmorphism */}
      <header className="glass glass-header-glow sticky top-0 z-50" role="banner">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg shadow-md" aria-hidden="true">
                <Activity className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Kametrix</h1>
            </div>

            {/* Theme Toggle & User Menu */}
            <div className="flex items-center gap-3" role="group" aria-label="User controls">
              <ThemeToggle />
              <UserMenu user={user} />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs with glass effect */}
      <nav className="glass border-b border-border/50" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-8">
          <NavTabs />
        </div>
      </nav>

      {/* Main Content */}
      <main
        id="main-content"
        className="relative max-w-7xl mx-auto px-8 py-8"
        role="main"
        aria-label="Main content"
      >
        {children}
      </main>
    </div>
  );
}
