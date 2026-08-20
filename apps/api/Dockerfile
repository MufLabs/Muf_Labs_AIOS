# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./

# Copy root types for external module declarations
COPY types ./types

# Copy all packages and the api app
COPY packages ./packages
COPY apps/api ./apps/api

# Install pnpm
RUN corepack enable pnpm

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build the api app and its dependencies (includes typecheck)
RUN pnpm run build --filter=@aios/api --filter=@aios/api^...

# Create production deployment using pnpm deploy
RUN pnpm deploy --prod /app/prod --filter=@aios/api --legacy

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production deployment from builder
COPY --from=builder /app/prod ./

# Create data directory for T-Bit persistence
RUN mkdir -p /data && chown -R nodejs:nodejs /data

USER nodejs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# Healthcheck uses readiness endpoint (/readyz) via IPv4 loopback
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:3001/readyz || exit 1

CMD ["dumb-init", "node", "dist/main.js"]
