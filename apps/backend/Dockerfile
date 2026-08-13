# Production Dockerfile for NestJS Backend Microservice
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy root monorepo files
COPY package.json package-lock.json ./
COPY packages/database ./packages/database
COPY apps/backend ./apps/backend

# Install dependencies
RUN npm ci

# Generate Prisma Client & Build NestJS
RUN npm run build --workspace=@trackmyhabits/database
RUN npm run build:server --workspace=@trackmyhabits/backend

# Production Runner Stage
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend ./apps/backend

EXPOSE 4000

CMD ["node", "apps/backend/dist/main.js"]
