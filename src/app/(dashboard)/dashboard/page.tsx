import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { GoogleConnectButton } from '@/components/dashboard/google-connect-button';
import { DashboardNotification } from '@/components/dashboard/dashboard-notification';
import {
  formatBalance,
  isLowBalance,
  hasGraceUsage,
  getLowBalanceMessage,
  getGraceUsageMessage,
} from '@/lib/credits-utils';

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

      {/* Low Balance / Grace Usage Warning */}
      {(isLowBalance(user.creditBalance) || hasGraceUsage(user.graceCreditsUsed)) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              {isLowBalance(user.creditBalance) && (
                <p className="text-amber-800 text-sm">
                  {getLowBalanceMessage(user.creditBalance)}
                </p>
              )}
              {hasGraceUsage(user.graceCreditsUsed) && (
                <p className="text-amber-800 text-sm mt-1">
                  {getGraceUsageMessage(user.graceCreditsUsed)}
                </p>
              )}
              <Link
                href="/dashboard/credits"
                className="text-amber-700 text-sm font-medium hover:underline mt-2 inline-block"
              >
                Buy more credits &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Credit Balance"
          value={formatBalance(user.creditBalance)}
          subtitle={isLowBalance(user.creditBalance) ? "low balance" : "available"}
          warning={isLowBalance(user.creditBalance)}
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
