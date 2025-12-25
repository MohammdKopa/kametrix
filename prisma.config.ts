// Prisma 7 configuration
import { defineConfig } from "prisma/config";

// Load dotenv for local development (optional)
if (process.env.NODE_ENV !== "production") {
  import("dotenv/config").catch(() => {});
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
