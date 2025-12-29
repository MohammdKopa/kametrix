# Technology Stack

**Analysis Date:** 2025-12-29

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code

**Secondary:**
- JavaScript - Build scripts, config files

## Runtime

**Environment:**
- Node.js (Next.js 15.5.9 compatible)
- Browser runtime for client components

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 15.5.9 - Full-stack web framework (App Router)
- React 19.2.3 - UI framework

**Testing:**
- Vitest 4.0.16 - Unit tests

**Build/Dev:**
- TypeScript 5.9.3 - Compilation
- PostCSS 8.5.6 - CSS processing
- Autoprefixer 10.4.23 - CSS vendor prefixes

## Key Dependencies

**Critical:**
- Prisma 7.2.0 - Database ORM with PostgreSQL adapter
- @vapi-ai/server-sdk 0.11.0 - Voice AI assistant creation
- stripe 20.1.0 - Payment processing
- googleapis 169.0.0 - Google Calendar/Sheets integration
- bcryptjs 3.0.3 - Password hashing

**Infrastructure:**
- pg 8.16.3 - PostgreSQL driver
- nodemailer 7.0.12 - Email delivery (SMTP)
- google-auth-library 10.5.0 - Google OAuth

**UI:**
- Radix UI - Component primitives (dialog, dropdown-menu, label, select, separator, slot, switch)
- Tailwind CSS 4.1.18 - Styling
- Lucide React 0.562.0 - Icon library
- Motion 12.23.26 - Animation library
- next-themes 0.4.6 - Theme management
- class-variance-authority 0.7.1 - CSS-in-JS utility

## Configuration

**Environment:**
- `.env` files (development, production)
- Required: DATABASE_URL, VAPI_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_ENCRYPTION_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SMTP_*, OPENROUTER_API_KEY, NEXT_PUBLIC_APP_URL

**Build:**
- `next.config.ts` - Next.js configuration (standalone output)
- `tsconfig.json` - TypeScript compiler options (strict mode)
- `components.json` - Shadcn/UI configuration

## Platform Requirements

**Development:**
- Any platform with Node.js
- PostgreSQL database (local or remote)
- Docker optional for local DB

**Production:**
- Self-hosted (not Vercel)
- Standalone Next.js build
- PostgreSQL database

---

*Stack analysis: 2025-12-29*
*Update after major dependency changes*
