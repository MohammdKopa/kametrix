'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Zap } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  // Format price in euros
  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  // Calculate estimated minutes (~€0.15/min)
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
    <Card
      className={cn(
        'relative glass-card border-0 flex flex-col transition-all duration-300 hover:scale-[1.02]',
        isPopular
          ? 'ring-2 ring-primary shadow-[0_0_30px_oklch(0.55_0.25_300_/_0.25)]'
          : 'hover:shadow-[0_0_20px_oklch(0.55_0.25_300_/_0.15)]'
      )}
    >
      {/* Popular badge */}
      {isPopular && (
        <Badge
          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-lg"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Most Popular
        </Badge>
      )}

      <CardHeader className="pb-2 pt-6">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          {isPopular && <Zap className="w-4 h-4 text-primary" />}
          {name}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Price */}
        <div>
          <span className="text-4xl font-bold text-foreground">
            {formatPrice(priceInCents)}
          </span>
        </div>

        {/* Credits and minutes */}
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-medium text-primary">{credits.toLocaleString()} credits</p>
          <p>~{estimatedMinutes} minutes of calls</p>

          {/* Settlement preview when grace period is active */}
          {hasGrace && canCoverGrace && (
            <p className="text-amber-400 text-xs mt-2 pt-2 border-t border-border">
              After €{(graceCreditsUsed / 100).toFixed(2)} grace settlement,
              you&apos;ll receive {effectiveCredits.toLocaleString()} credits (~{effectiveMinutes} min)
            </p>
          )}
          {hasGrace && !canCoverGrace && (
            <p className="text-red-400 text-xs mt-2 pt-2 border-t border-border">
              Pack does not cover €{(graceCreditsUsed / 100).toFixed(2)} grace balance
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          onClick={handleBuy}
          disabled={isLoading}
          variant={isPopular ? 'default' : 'outline'}
          className={cn(
            'w-full',
            isPopular && 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-0'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Redirecting...
            </>
          ) : (
            'Buy Credits'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
