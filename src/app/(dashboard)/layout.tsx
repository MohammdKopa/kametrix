import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-guard';
import { DashboardOnboardingWrapper } from '@/components/onboarding';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <DashboardOnboardingWrapper isNewUser={false}>
        {children}
      </DashboardOnboardingWrapper>
    </div>
  );
}
