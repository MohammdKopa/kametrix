import { prisma } from '@/lib/prisma';
import { StatsCard } from '@/components/dashboard/stats-card';
import { UserList } from '@/components/admin/user-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bot, Phone } from 'lucide-react';

export const dynamic = 'force-dynamic';

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
      <h1 className="text-2xl font-bold text-foreground mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="All registered users"
          icon={Users}
        />
        <StatsCard
          title="Total Agents"
          value={stats.totalAgents}
          subtitle="Across all users"
          icon={Bot}
        />
        <StatsCard
          title="Total Calls"
          value={stats.totalCalls}
          subtitle="Platform-wide"
          icon={Phone}
        />
      </div>

      {/* User List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-foreground">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserList />
        </CardContent>
      </Card>
    </div>
  );
}
