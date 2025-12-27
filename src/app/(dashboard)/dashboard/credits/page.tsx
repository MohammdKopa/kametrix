import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CreditPackCard } from '@/components/dashboard/credit-pack-card';
import { CreditsNotification } from './credits-notification';
import { formatBalance } from '@/lib/credits-utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export default async function CreditsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Await searchParams as required by Next.js 15
  const params = await searchParams;

  // Fetch user with credit info and all active credit packs
  const [userWithCredits, creditPacks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        creditBalance: true,
        graceCreditsUsed: true,
      },
    }),
    prisma.creditPack.findMany({
      where: { isActive: true },
      orderBy: { priceInCents: 'asc' },
    }),
  ]);

  if (!userWithCredits) {
    redirect('/login');
  }

  // Determine which pack is "popular" (second pack by price, or mark by name)
  const popularPackIndex = creditPacks.findIndex(
    (pack) => pack.name.toLowerCase().includes('popular')
  );
  const popularPackId = popularPackIndex >= 0
    ? creditPacks[popularPackIndex].id
    : creditPacks[1]?.id; // Default to second pack if no "popular" in name

  return (
    <div className="space-y-6">
      {/* Success/Cancel Notifications */}
      {params.success === 'true' && (
        <CreditsNotification
          type="success"
          message="Credits added successfully! Your balance has been updated."
        />
      )}
      {params.canceled === 'true' && (
        <CreditsNotification
          type="info"
          message="Purchase canceled. No charges were made."
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-[var(--foreground)]">Buy Credits</h1>
        <p className="text-gray-500 dark:text-[var(--muted-foreground)] mt-1">
          Purchase credits to power your AI phone agents
        </p>
      </div>

      {/* Current Balance */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-[var(--muted-foreground)]">Current Balance</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-[var(--accent)] mt-1">
              {formatBalance(userWithCredits.creditBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Grace Period Banner - Prominent when active */}
      {userWithCredits.graceCreditsUsed > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 dark:bg-amber-500/10 dark:border-[var(--accent)]/50">
          <div className="flex items-center gap-3">
            <svg
              className="h-6 w-6 text-amber-500 dark:text-amber-400 flex-shrink-0"
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
              <p className="text-amber-800 dark:text-amber-300 font-medium">Grace Period Active</p>
              <p className="text-amber-700 dark:text-amber-400 text-sm">
                You have ${(userWithCredits.graceCreditsUsed / 100).toFixed(2)} in grace credits
                that will be automatically settled on your next purchase.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Credit Packs Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--foreground)] mb-4">
          Choose a Credit Pack
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {creditPacks.map((pack) => (
            <CreditPackCard
              key={pack.id}
              id={pack.id}
              name={pack.name}
              credits={pack.credits}
              priceInCents={pack.priceInCents}
              isPopular={pack.id === popularPackId}
              graceCreditsUsed={userWithCredits.graceCreditsUsed}
            />
          ))}
        </div>
      </div>

      {/* Info section */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 dark:bg-[var(--muted)] dark:border-[var(--border)]">
        <h3 className="text-sm font-medium text-gray-900 dark:text-[var(--foreground)] mb-3">
          How credits work
        </h3>
        <ul className="text-sm text-gray-600 dark:text-[var(--muted-foreground)] space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-[var(--accent)] mt-1">&#8226;</span>
            <span>Credits are charged at $0.15 per minute of call time</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--accent)] mt-1">&#8226;</span>
            <span>Unused credits never expire</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--accent)] mt-1">&#8226;</span>
            <span>Grace credits allow calls to continue even when your balance is low</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
