import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CallList } from '@/components/dashboard/call-list';
import { StatusFilter } from '@/components/dashboard/status-filter';

export const dynamic = 'force-dynamic';

interface CallsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function CallsPage({ searchParams }: CallsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Await searchParams
  const params = await searchParams;
  const statusFilter = params.status;

  // Build where clause
  const where: any = {
    userId: user.id,
  };

  if (statusFilter) {
    where.status = statusFilter;
  }

  // Fetch initial calls (first page)
  const limit = 20;
  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      include: {
        agent: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    }),
    prisma.call.count({ where }),
  ]);

  const hasMore = calls.length < total;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Call History</h1>
          <p className="text-gray-500 mt-1">
            View all calls handled by your agents
          </p>
        </div>
      </div>

      {/* Filter */}
      <StatusFilter currentStatus={statusFilter} />

      {/* Call List */}
      <CallList
        initialCalls={calls}
        initialTotal={total}
        initialHasMore={hasMore}
        statusFilter={statusFilter}
      />
    </div>
  );
}
