'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface CreditPackCardProps {
  id: string;
  name: string;
  credits: number;
  priceInCents: number;
  isPopular?: boolean;
  graceCreditsUsed?: number;
}

export function CreditPackCard({
  id,
  name,
  credits,
  priceInCents,
  isPopular = false,
  graceCreditsUsed = 0,
}: CreditPackCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Calculate estimated minutes (~$0.15/min)
  const estimatedMinutes = Math.floor(credits / 15);

  // Calculate settlement preview when grace credits are active
  // Only show if pack price can cover grace amount
  const hasGrace = graceCreditsUsed > 0;
  const canCoverGrace = credits >= graceCreditsUsed;
  const effectiveCredits = canCoverGrace ? credits - graceCreditsUsed : 0;
  const effectiveMinutes = Math.floor(effectiveCredits / 15);

  const handleBuy = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packId: id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setIsLoading(false);
      // Could add toast notification here
    }
  };

  return (
    <div
      className={`
        relative bg-white rounded-xl border-2 p-6 flex flex-col transition-all duration-200
        dark:glass-card
        ${isPopular
          ? 'border-blue-500 shadow-lg dark:border-[var(--accent)] dark:shadow-[0_0_25px_rgba(152,58,214,0.25)]'
          : 'border-gray-200 hover:border-gray-300 dark:border-[var(--border)] dark:hover:border-[var(--accent)]/50'
        }
      `}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white dark:bg-[var(--accent)]">
            <Sparkles className="w-3 h-3" />
            Most Popular
          </span>
        </div>
      )}

      {/* Pack name */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-[var(--foreground)] mb-2">{name}</h3>

      {/* Price */}
      <div className="mb-4">
        <span className="text-3xl font-bold text-gray-900 dark:text-[var(--foreground)]">
          {formatPrice(priceInCents)}
        </span>
      </div>

      {/* Credits and minutes */}
      <div className="mb-6 text-sm text-gray-600 dark:text-[var(--muted-foreground)]">
        <p className="font-medium">{credits.toLocaleString()} credits</p>
        <p>~{estimatedMinutes} minutes of calls</p>
        {/* Settlement preview when grace period is active */}
        {hasGrace && canCoverGrace && (
          <p className="text-amber-600 dark:text-amber-400 text-xs mt-2">
            After ${(graceCreditsUsed / 100).toFixed(2)} grace settlement,
            you&apos;ll receive {effectiveCredits.toLocaleString()} credits (~{effectiveMinutes} min)
          </p>
        )}
        {hasGrace && !canCoverGrace && (
          <p className="text-red-600 dark:text-red-400 text-xs mt-2">
            Pack does not cover ${(graceCreditsUsed / 100).toFixed(2)} grace balance
          </p>
        )}
      </div>

      {/* Buy button */}
      <button
        onClick={handleBuy}
        disabled={isLoading}
        className={`
          mt-auto w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
          ${isPopular
            ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 dark:bg-[var(--accent)] dark:hover:bg-[var(--accent-secondary)] dark:focus:ring-[var(--accent)]'
            : 'bg-gray-800 hover:bg-gray-900 focus:ring-gray-500 dark:bg-[var(--muted)] dark:hover:bg-[var(--border)] dark:focus:ring-[var(--border)]'
          }
          dark:focus:ring-offset-[var(--background)]
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Redirecting...
          </>
        ) : (
          'Buy Credits'
        )}
      </button>
    </div>
  );
}
