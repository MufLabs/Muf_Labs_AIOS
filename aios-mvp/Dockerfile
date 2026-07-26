# Backend Dockerfile - MufLabs AIOS MVP
FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install deps (--ignore-scripts evita compilar better-sqlite3 en Alpine)
RUN npm install --ignore-scripts 2>&1 | tail -5

# Copy source code
COPY tsconfig.json ./
COPY src/ src/

# Expose API port
EXPOSE 3000

# Use tsx for runtime (dev-mode ready)
CMD ["npx", "tsx", "src/index.ts"]