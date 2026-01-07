import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { AdminNavTabs } from '@/components/admin/admin-nav-tabs';
import { UserMenu } from '@/components/dashboard/user-menu';
import { ThemeToggle } from '@/components/dashboard/theme-toggle';
import { Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Only admins can access this section
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Ambient glow effect */}
      <div className="glow-accent" />

      {/* Header with glassmorphism */}
      <header className="glass glass-header-glow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Back to Dashboard & Logo/Brand */}
            <div className="flex items-center gap-4">
              {/* Back to Dashboard Button */}
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/50 hover:text-foreground hover:border-border/80 transition-all duration-150"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <div className="h-6 w-px bg-border/50" />

              {/* Logo/Brand */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg shadow-md">
                  <Activity className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Kametrix</h1>
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded">
                  Admin
                </span>
              </div>
            </div>

            {/* Theme Toggle & User Menu */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserMenu user={user} />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs with glass effect */}
      <div className="glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-8">
          <AdminNavTabs />
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}
