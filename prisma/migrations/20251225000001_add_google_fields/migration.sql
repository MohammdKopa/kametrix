-- AddGoogleIntegrationFields
ALTER TABLE "User" ADD COLUMN "googleRefreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN "googleSheetId" TEXT;
ALTER TABLE "User" ADD COLUMN "googleConnectedAt" TIMESTAMP(3);
