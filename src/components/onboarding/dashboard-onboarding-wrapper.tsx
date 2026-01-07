'use client';

import { ReactNode } from 'react';
import { OnboardingProvider } from './onboarding-provider';

interface DashboardOnboardingWrapperProps {
  children: ReactNode;
  isNewUser: boolean;
}

export function DashboardOnboardingWrapper({
  children,
  isNewUser,
}: DashboardOnboardingWrapperProps) {
  return (
    <OnboardingProvider isNewUser={isNewUser}>
      {children}
    </OnboardingProvider>
  );
}
