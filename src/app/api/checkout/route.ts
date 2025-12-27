import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';

/**
 * POST /api/checkout
 * Create a Stripe Checkout Session for purchasing credit packs
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(request);

    // Get packId from request body
    const body = await request.json();
    const { packId } = body;

    if (!packId) {
      return NextResponse.json(
        { error: 'Pack ID is required' },
        { status: 400 }
      );
    }

    // Fetch the credit pack
    const creditPack = await prisma.creditPack.findUnique({
      where: { id: packId },
    });

    if (!creditPack) {
      return NextResponse.json(
        { error: 'Credit pack not found' },
        { status: 404 }
      );
    }

    if (!creditPack.isActive) {
      return NextResponse.json(
        { error: 'Credit pack is no longer available' },
        { status: 400 }
      );
    }

    if (!creditPack.stripePriceId) {
      console.error('Credit pack missing Stripe price ID:', creditPack.id);
      return NextResponse.json(
        { error: 'Credit pack is not configured for payment' },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, stripeCustomerId: true },
    });

    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let stripeCustomerId = fullUser.stripeCustomerId;

    // Create Stripe customer if needed
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: fullUser.email,
        metadata: {
          userId: fullUser.id,
        },
      });

      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: fullUser.id },
        data: { stripeCustomerId },
      });
    }

    // Create Checkout Session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [
        {
          price: creditPack.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/credits?success=true`,
      cancel_url: `${appUrl}/dashboard/credits?canceled=true`,
      metadata: {
        userId: user.id,
        creditPackId: creditPack.id,
        creditsAmount: creditPack.credits.toString(),
      },
    });

    // Return the session URL for redirect
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
