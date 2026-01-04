-- AddGoogleTokenCacheFields
-- Adds googleAccessToken and googleTokenExpiresAt fields for automatic token refresh

ALTER TABLE "User" ADD COLUMN "googleAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN "googleTokenExpiresAt" TIMESTAMP(3);
