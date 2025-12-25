import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { GoogleConnectButton } from '@/components/dashboard/google-connect-button';
import { DashboardNotification } from '@/components/dashboard/dashboard-notification';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (!user) {
    redirect('/login');
  }

  // Map URL params to notification messages
  const getNotification = () => {
    if (params.success === 'google_connected') {
      return { type: 'success' as const, message: 'Google account connected successfully!' };
    }
    if (params.error === 'google_auth_denied') {
      return { type: 'error' as const, message: 'Google authorization was denied. Please try again.' };
    }
    if (params.error === 'google_auth_failed') {
      return { type: 'error' as const, message: 'Failed to connect Google account. Please try again.' };
    }
    if (params.error === 'no_refresh_token') {
      return { type: 'error' as const, message: 'Could not get Google permissions. Please try again.' };
    }
    return null;
  };

  const notification = getNotification();

  return (
    <div className="space-y-8">
      {/* Notification Banner */}
      {notification && (
        <DashboardNotification type={notification.type} message={notification.message} />
      )}

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user.name || user.email.split('@')[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what's happening with your voice agents
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Credit Balance"
          value={user.creditBalance.toLocaleString()}
          subtitle="credits remaining"
        />
        <StatsCard
          title="Active Agents"
          value={0}
          subtitle="currently running"
        />
        <StatsCard
          title="Calls This Month"
          value={0}
          subtitle="total calls"
        />
      </div>

      {/* Google Integration */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Integrations</h2>
        <div className="max-w-md">
          <GoogleConnectButton
            isConnected={!!user.googleConnectedAt}
            connectedAt={user.googleConnectedAt}
            googleSheetId={user.googleSheetId}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
