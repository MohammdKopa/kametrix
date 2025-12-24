import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CreditBalance } from '@/components/dashboard/credit-balance';
import { TransactionList } from '@/components/dashboard/transaction-list';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's full info
  const userWithCredits = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      name: true,
      creditBalance: true,
      graceCreditsUsed: true,
    },
  });

  if (!userWithCredits) {
    redirect('/login');
  }

  // Fetch initial transactions (first page)
  const limit = 20;
  const [transactions, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    }),
    prisma.creditTransaction.count({
      where: { userId: user.id },
    }),
  ]);

  const hasMore = transactions.length < total;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and credits</p>
      </div>

      {/* Account Info Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Account Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{userWithCredits.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-sm text-gray-900">
              {userWithCredits.name || 'Not set'}
            </p>
          </div>
        </div>
      </div>

      {/* Credits Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Credits</h2>

        {/* Credit Balance Card */}
        <CreditBalance
          balance={userWithCredits.creditBalance}
          graceCreditsUsed={userWithCredits.graceCreditsUsed}
        />

        {/* Transaction History */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">
            Transaction History
          </h3>
          <TransactionList
            initialTransactions={transactions}
            initialTotal={total}
            initialHasMore={hasMore}
          />
        </div>
      </div>

      {/* Future Settings Placeholder */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Additional Settings
        </h2>
        <p className="text-sm text-gray-500">
          More settings options will be available here soon.
        </p>
      </div>
    </div>
  );
}
