'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Info, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreditsNotificationProps {
  type: 'success' | 'info' | 'error';
  message: string;
}

export function CreditsNotification({
  type,
  message,
}: CreditsNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  // Auto-dismiss after 5 seconds and clean up URL
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Clean up URL params
    router.replace('/dashboard/credits', { scroll: false });
  };

  if (!isVisible) {
    return null;
  }

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600',
      hoverBg: 'hover:bg-green-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      hoverBg: 'hover:bg-blue-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      hoverBg: 'hover:bg-red-600',
    },
  };

  const style = styles[type];

  return (
    <div
      className={`rounded-lg p-4 flex items-center justify-between ${style.bg} border ${style.border}`}
    >
      <div className="flex items-center gap-3">
        {type === 'success' ? (
          <CheckCircle className={`w-5 h-5 ${style.icon} flex-shrink-0`} />
        ) : (
          <Info className={`w-5 h-5 ${style.icon} flex-shrink-0`} />
        )}
        <p className={`text-sm font-medium ${style.text}`}>{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className={`p-1 rounded-md hover:bg-opacity-20 ${style.hoverBg}`}
      >
        <X className={`w-4 h-4 ${style.icon}`} />
      </button>
    </div>
  );
}
