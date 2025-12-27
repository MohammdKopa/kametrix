import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Credit pack definitions
const CREDIT_PACKS = [
  { name: 'Starter', credits: 1000, priceInCents: 1000 },    // $10 ~66 min
  { name: 'Popular', credits: 2500, priceInCents: 2500 },    // $25 ~166 min
  { name: 'Pro', credits: 5000, priceInCents: 5000 },        // $50 ~333 min
  { name: 'Business', credits: 10000, priceInCents: 10000 }, // $100 ~666 min
];

async function seedAdmin() {
  const adminEmail = 'admin@kametrix.com';
  const adminPassword = 'admin123';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    // Update to admin role if not already
    if (existingAdmin.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN' },
      });
      console.log(`Updated ${adminEmail} to ADMIN role`);
    } else {
      console.log(`Admin user ${adminEmail} already exists`);
    }
    return;
  }

  // Create admin user
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
      creditBalance: 10000, // $100 in credits
    },
  });

  console.log(`Created admin user: ${admin.email}`);
  console.log(`Password: ${adminPassword}`);
}

async function seedCreditPacks() {
  console.log('\nSeeding credit packs...');

  // Check if Stripe is configured
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  let stripe: Stripe | null = null;

  if (stripeSecretKey && stripeSecretKey !== 'sk_test_placeholder') {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });
    console.log('Stripe configured - will create Stripe products/prices');
  } else {
    console.log('Stripe not configured - skipping Stripe product creation');
    console.log('Set STRIPE_SECRET_KEY to create products in Stripe');
  }

  for (const pack of CREDIT_PACKS) {
    // Check if pack already exists
    const existingPack = await prisma.creditPack.findFirst({
      where: { name: pack.name },
    });

    if (existingPack) {
      console.log(`Credit pack "${pack.name}" already exists (id: ${existingPack.id})`);
      continue;
    }

    let stripePriceId: string | null = null;

    // Create Stripe product and price if configured
    if (stripe) {
      try {
        // Create product
        const product = await stripe.products.create({
          name: `Kametrix - ${pack.name} Credit Pack`,
          description: `${pack.credits} credits for voice agent calls (~${Math.floor(pack.credits / 15)} minutes)`,
          metadata: {
            credits: pack.credits.toString(),
            type: 'credit_pack',
          },
        });

        // Create price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: pack.priceInCents,
          currency: 'usd',
        });

        stripePriceId = price.id;
        console.log(`Created Stripe product/price for "${pack.name}": ${stripePriceId}`);
      } catch (error) {
        console.error(`Failed to create Stripe product for "${pack.name}":`, error);
        // Continue without Stripe price - can be added later
      }
    }

    // Create credit pack in database
    const creditPack = await prisma.creditPack.create({
      data: {
        name: pack.name,
        credits: pack.credits,
        priceInCents: pack.priceInCents,
        stripePriceId,
        isActive: true,
      },
    });

    console.log(`Created credit pack: ${creditPack.name} (${creditPack.credits} credits, $${(creditPack.priceInCents / 100).toFixed(2)})`);
  }

  // List all credit packs
  const allPacks = await prisma.creditPack.findMany({
    where: { isActive: true },
    orderBy: { priceInCents: 'asc' },
  });

  console.log(`\nTotal active credit packs: ${allPacks.length}`);
  for (const p of allPacks) {
    console.log(`  - ${p.name}: ${p.credits} credits, $${(p.priceInCents / 100).toFixed(2)}${p.stripePriceId ? ` (Stripe: ${p.stripePriceId})` : ''}`);
  }
}

async function main() {
  await seedAdmin();
  await seedCreditPacks();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
