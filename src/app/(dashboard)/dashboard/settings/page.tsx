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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-[var(--foreground)]">Settings</h1>
        <p className="text-gray-500 dark:text-[var(--muted-foreground)] mt-1">Manage your account and credits</p>
      </div>

      {/* Account Info Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 dark:glass-card dark:border-[var(--border)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-gray-100 text-gray-600 dark:bg-[var(--accent)]/20 dark:text-[var(--accent)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--foreground)]">
            Account Information
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--muted-foreground)]">Email</label>
            <p className="mt-1 text-sm text-gray-900 dark:text-[var(--foreground)]">{userWithCredits.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--muted-foreground)]">Name</label>
            <p className="mt-1 text-sm text-gray-900 dark:text-[var(--foreground)]">
              {userWithCredits.name || <span className="text-gray-400 dark:text-[var(--muted-foreground)] italic">Not set</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Credits Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--foreground)]">Credits</h2>

        {/* Credit Balance Card */}
        <CreditBalance
          balance={userWithCredits.creditBalance}
          graceCreditsUsed={userWithCredits.graceCreditsUsed}
        />

        {/* Transaction History */}
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-[var(--foreground)] mb-3">
            Transaction History
          </h3>
          <TransactionList
            initialTransactions={transactions}
            initialTotal={total}
            initialHasMore={hasMore}
          />
        </div>
      </div>
    </div>
  );
}
