'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardNotificationProps {
  type: 'success' | 'error';
  message: string;
}

export function DashboardNotification({
  type,
  message,
}: DashboardNotificationProps) {
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
    router.replace('/dashboard', { scroll: false });
  };

  if (!isVisible) {
    return null;
  }

  const isSuccess = type === 'success';

  return (
    <div
      className={`rounded-lg p-4 flex items-center justify-between ${
        isSuccess
          ? 'bg-green-50 border border-green-200'
          : 'bg-red-50 border border-red-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {isSuccess ? (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        )}
        <p
          className={`text-sm font-medium ${
            isSuccess ? 'text-green-800' : 'text-red-800'
          }`}
        >
          {message}
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className={`p-1 rounded-md hover:bg-opacity-20 ${
          isSuccess ? 'hover:bg-green-600' : 'hover:bg-red-600'
        }`}
      >
        <X
          className={`w-4 h-4 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}
        />
      </button>
    </div>
  );
}
