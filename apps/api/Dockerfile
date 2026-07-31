# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./

# Copy all packages and the api app
COPY packages ./packages
COPY apps/api ./apps/api

# Install pnpm
RUN corepack enable pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the api app (includes typecheck)
RUN pnpm run build --filter=@aios/api...

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy built packages and api dist
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./dist

# Install production dependencies only
RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile --prod

# Create data directory for T-Bit persistence
RUN mkdir -p /data && chown -R nodejs:nodejs /data

USER nodejs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "dist/server.js"]
