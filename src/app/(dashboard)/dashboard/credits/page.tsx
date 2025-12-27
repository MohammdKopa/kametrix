import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CreditPackCard } from '@/components/dashboard/credit-pack-card';
import { CreditsNotification } from './credits-notification';
import { formatBalance } from '@/lib/credits-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, AlertTriangle, Info } from 'lucide-react';

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
        <h1 className="text-2xl font-semibold text-foreground">Buy Credits</h1>
        <p className="text-muted-foreground mt-1">
          Purchase credits to power your AI phone agents
        </p>
      </div>

      {/* Current Balance */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                <p className="text-3xl font-bold text-primary mt-1">
                  {formatBalance(userWithCredits.creditBalance)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grace Period Banner - Prominent when active */}
      {userWithCredits.graceCreditsUsed > 0 && (
        <Card className="border-2 border-amber-500/50 bg-amber-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-amber-300 font-medium">Grace Period Active</p>
                <p className="text-amber-400/80 text-sm">
                  You have ${(userWithCredits.graceCreditsUsed / 100).toFixed(2)} in grace credits
                  that will be automatically settled on your next purchase.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Packs Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Choose a Credit Pack
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 mt-0.5">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">
                How credits work
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">&#8226;</span>
                  <span>Credits are charged at $0.15 per minute of call time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">&#8226;</span>
                  <span>Unused credits never expire</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">&#8226;</span>
                  <span>Grace credits allow calls to continue even when your balance is low</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
