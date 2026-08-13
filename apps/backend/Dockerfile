# Production Dockerfile for NestJS Backend Microservice
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo files
COPY package.json package-lock.json turbo.json ./
COPY packages/database ./packages/database
COPY apps/backend ./apps/backend

# Install dependencies
RUN npm ci

# Generate Prisma Client & Build NestJS
RUN npm run build --workspace=packages/database
RUN npm run build --workspace=apps/backend

# Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend ./apps/backend

EXPOSE 4000

CMD ["node", "apps/backend/dist/main.js"]
