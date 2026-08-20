# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./

# Copy packages and web app only (minimize build context)
COPY packages ./packages
COPY apps/web ./apps/web

# Install pnpm
RUN corepack enable pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the web app (includes typecheck)
RUN pnpm run build --filter=@aios/web...

# Production stage - nginx to serve static files
FROM nginx:alpine AS runner

# Copy built assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx config for SPA routing with security headers
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck for nginx via IPv4 loopback
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]