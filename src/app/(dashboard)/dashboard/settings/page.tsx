import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CreditBalance } from '@/components/dashboard/credit-balance';
import { TransactionList } from '@/components/dashboard/transaction-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, CreditCard, History } from 'lucide-react';

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
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and credits</p>
      </div>

      {/* Account Info Section */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-foreground">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <User className="w-5 h-5 text-primary" />
            </div>
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-foreground">{userWithCredits.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-foreground">
                {userWithCredits.name || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credits Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Credits</h2>
        </div>

        {/* Credit Balance Card */}
        <CreditBalance
          balance={userWithCredits.creditBalance}
          graceCreditsUsed={userWithCredits.graceCreditsUsed}
        />

        {/* Transaction History */}
        <Card className="glass-card border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-foreground text-base">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                <History className="w-4 h-4 text-primary" />
              </div>
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TransactionList
              initialTransactions={transactions}
              initialTotal={total}
              initialHasMore={hasMore}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
