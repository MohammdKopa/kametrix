import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@/generated/prisma/client';

/**
 * Stripe webhook endpoint - handles payment events
 *
 * Events handled:
 * - checkout.session.completed: Credit pack purchase completed
 *
 * CRITICAL: Uses request.text() NOT request.json() for signature verification
 */
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    console.error('Stripe webhook: missing signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`Stripe webhook: ${event.type}`);

  // Handle specific event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleSuccessfulPayment(session);
      break;
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle successful credit pack purchase
 * Adds credits to user's balance with full audit trail
 */
async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const creditsAmount = parseInt(session.metadata?.creditsAmount || '0', 10);
  const creditPackId = session.metadata?.creditPackId;

  if (!userId || !creditsAmount) {
    console.error('Stripe webhook: missing required metadata', {
      userId,
      creditsAmount,
      creditPackId,
    });
    throw new Error('Missing metadata in checkout session');
  }

  console.log(`Processing payment for user ${userId}: ${creditsAmount} credits`);

  try {
    await prisma.$transaction(async (tx) => {
      // Get current user balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true, graceCreditsUsed: true },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Calculate new balance
      // Grace credits are already reflected in balance (it went negative or stayed at 0)
      // When user purchases, credits go to balance and grace usage is settled
      let newBalance = user.creditBalance + creditsAmount;
      let newGraceUsed = user.graceCreditsUsed;

      // Settle grace credits if any were used
      if (user.graceCreditsUsed > 0) {
        // The grace credits used were tracked but balance might be at 0 or negative
        // Settlement means we acknowledge they've now paid for that usage
        newGraceUsed = Math.max(0, user.graceCreditsUsed - creditsAmount);
        // If they bought more than their grace usage, balance goes positive
        // If they bought less, remaining grace is still owed (edge case)
      }

      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: {
          creditBalance: newBalance,
          graceCreditsUsed: newGraceUsed,
        },
      });

      // Record transaction for audit trail
      await tx.creditTransaction.create({
        data: {
          userId,
          type: TransactionType.PURCHASE,
          amount: creditsAmount,
          balanceAfter: newBalance,
          stripePaymentId: session.payment_intent as string | undefined,
          description: `Purchased ${creditsAmount} credits`,
        },
      });

      console.log(
        `Credits added: user=${userId}, amount=${creditsAmount}, newBalance=${newBalance}, graceSettled=${user.graceCreditsUsed - newGraceUsed}`
      );
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error; // Re-throw to signal webhook failure for retry
  }
}
