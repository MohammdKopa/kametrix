import { prisma } from '@/lib/prisma';
import { StatsCard } from '@/components/dashboard/stats-card';
import { UserList } from '@/components/admin/user-list';

async function getAdminStats() {
  const [totalUsers, totalAgents, totalCalls] = await Promise.all([
    prisma.user.count(),
    prisma.agent.count(),
    prisma.call.count(),
  ]);

  return { totalUsers, totalAgents, totalCalls };
}

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="All registered users"
        />
        <StatsCard
          title="Total Agents"
          value={stats.totalAgents}
          subtitle="Across all users"
        />
        <StatsCard
          title="Total Calls"
          value={stats.totalCalls}
          subtitle="Platform-wide"
        />
      </div>

      {/* User List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">All Users</h2>
        <UserList />
      </div>
    </div>
  );
}
