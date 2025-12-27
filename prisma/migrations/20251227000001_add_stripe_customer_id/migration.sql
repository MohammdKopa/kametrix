-- AddStripeCustomerId
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;

-- Add unique constraint
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
