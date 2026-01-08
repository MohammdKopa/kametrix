# =============================================================================
# Kametrix Production Dockerfile
# =============================================================================
# Multi-stage build optimized for Next.js with proper cache invalidation
# to prevent "Failed to find Server Action" errors in production
# =============================================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for cache busting and build identification
ARG BUILD_ID
ARG GIT_SHA
ARG BUILD_TIMESTAMP

# Set build environment variables
ENV NEXT_BUILD_ID=${BUILD_ID:-auto}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP:-unknown}
ENV GIT_SHA=${GIT_SHA:-unknown}

# Copy package files first (for better layer caching)
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies with clean cache
RUN npm ci --prefer-offline

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# =============================================================================
# IMPORTANT: Clean any existing build artifacts before building
# This prevents stale Server Action references from previous builds
# =============================================================================
RUN rm -rf .next

# Generate a consistent build ID if not provided
# This ensures client and server bundles reference the same internal IDs
RUN if [ "$BUILD_ID" = "auto" ] || [ -z "$BUILD_ID" ]; then \
      echo "Generating build ID from git SHA and timestamp..."; \
      BUILD_ID="${GIT_SHA:-$(date +%s)}"; \
    fi && \
    echo "$BUILD_ID" > .next-build-id

# Build the application with increased memory and explicit build ID
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

# Run the build - Next.js will use .next-build-id if present
RUN npm run build

# Store build metadata for runtime verification
RUN echo "{\"buildId\": \"$(cat .next/BUILD_ID 2>/dev/null || echo 'unknown')\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"gitSha\": \"${GIT_SHA:-unknown}\"}" > .next/build-metadata.json

# =============================================================================
# Production stage - minimal runtime image
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets from standalone output
# IMPORTANT: Copy in specific order to maintain consistency
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public folder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Copy build metadata for health checks
COPY --from=builder --chown=nextjs:nodejs /app/.next/build-metadata.json ./.next/build-metadata.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/BUILD_ID ./.next/BUILD_ID

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health?quick=true || exit 1

CMD ["node", "server.js"]
