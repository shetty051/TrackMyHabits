# 🚀 Production Deployment Guide - TrackMyHabits

This document provides a step-by-step production deployment guide for the `TrackMyHabits` monorepo architecture.

---

## 🏛️ Production Architecture Overview

```mermaid
graph TD
    User["🌐 User Web & Mobile Browsers"] --> Vercel["⚡ Vercel (Next.js 14 Frontend + Serverless API Routes + Vercel Cron)"]
    Vercel --> NeonDB[("🐘 Neon / Supabase Managed PostgreSQL Database")]
    Railway["🚂 Railway / Render (NestJS Microservice)"] --> NeonDB
    Vercel -- "Cross-Service API Calls & CORS" --> Railway
```

---

## 1. Managed PostgreSQL Provisioning (Neon / Supabase)

### Step 1: Create Managed PostgreSQL Instance
1. Sign in to [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2. Create a new project named `trackmyhabits-prod`.
3. Copy the pooled connection string:
   ```env
   DATABASE_URL="postgres://user:password@ep-cool-db-123456.us-east-2.aws.neon.tech/trackmyhabits?sslmode=require"
   ```

### Step 2: Run Prisma Migrations
Run Prisma migrations from your terminal against the production database:
```bash
# Generate Prisma Client
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Deploy Database Schema Migrations to Managed PostgreSQL
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

---

## 2. Next.js Frontend Deployment (Vercel)

### Step 1: Link Repository to Vercel
1. Import `shetty051/TrackMyHabits` into [Vercel](https://vercel.com).
2. Select Root Directory: `./` (Monorepo root).
3. Build Command: `npm run build --workspace=apps/frontend`
4. Output Directory: `apps/frontend/.next`

### Step 2: Configure Environment Variables in Vercel
Add the following production environment variables under **Project Settings -> Environment Variables**:

| Variable Name | Description | Example Production Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Managed PostgreSQL Connection String | `postgres://user:pass@ep-cool.neon.tech/trackmyhabits?sslmode=require` |
| `NEXTAUTH_URL` | Live Production Frontend Domain | `https://trackmyhabits.vercel.app` |
| `NEXTAUTH_SECRET` | Secret token for NextAuth session encryption | `generate-random-secret-key-32chars` |
| `GEMINI_API_KEY` | Google Gemini AI Studio API Key | `AIzaSy...` |
| `NEXT_PUBLIC_BACKEND_URL` | NestJS Microservice URL | `https://backend-production.up.railway.app` |

---

## 3. NestJS Backend Microservice Deployment (Railway / Render)

### Step 1: Create Service on Railway or Render
1. Connect `shetty051/TrackMyHabits` to [Railway](https://railway.app) or [Render](https://render.com).
2. Specify Dockerfile Path: `apps/backend/Dockerfile`.
3. Set Port: `4000`.

### Step 2: Configure Environment Variables
Add the following production environment variables to your NestJS backend container:

| Variable Name | Description | Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Managed PostgreSQL Connection String | `postgres://user:pass@ep-cool.neon.tech/trackmyhabits?sslmode=require` |
| `PORT` | Listening Port | `4000` |
| `FRONTEND_URL` | Production Frontend Domain | `https://trackmyhabits.vercel.app` |

---

## 4. Production Daily Rollover Cron Configuration

In production, daily rollover is managed by **Vercel Crons** (`vercel.json`), which automatically invokes `/api/cron/rollover` every night at 12:00 AM UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/rollover",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Manual Trigger for Testing
You can manually test the day-boundary rollover in production at any time:
```bash
curl -X POST https://trackmyhabits.vercel.app/api/cron/rollover
```

---

## 5. Production Smoke Test Checklist

- [x] **User Authentication**: Sign up & login creating real records in PostgreSQL.
- [x] **Onboarding & Tutorial**: Verify Intro Rooney sequence and guided step tutorial.
- [x] **Habit Management**: Create, edit, complete, and freeze habits.
- [x] **Badge Unlocking**: Milestone habits trigger real `UserBadge` unlocks in PostgreSQL.
- [x] **Gemini AI Chat**: Ask Rooney about continuation likelihood and badges, receiving live grounded Gemini responses.
- [x] **Theme Persistence**: Toggle dark/light theme and verify persistence across reloads.
- [x] **Day Rollover & Freezes**: Trigger `POST /api/cron/rollover` and verify freeze consumption / streak break notifications.
