import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentActivity } from '@/components/dashboard/recent-activity';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
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

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
