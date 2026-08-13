# ⚡ TrackMyHabits — Monorepo Architecture

A full-stack habit tracking application powered by Next.js 14, NestJS, Prisma, and Rooney — an interactive AI habit companion avatar.

---

## 📁 Repository Structure

```
TrackMyHabits/
├── apps/
│   ├── frontend/         # Next.js 14 App Router UI (Auth, Dashboard, Rooney Companion, Insights, Rewards)
│   └── backend/          # NestJS Microservice (Cron schedulers for daily reminders & day rollover freeze consumption)
├── packages/
│   └── database/         # Prisma Client, SQLite schema, and database seed script
├── .gitignore            # Clean root gitignore (ignoring node_modules, build outputs, SQLite DBs & env files)
├── package.json          # Root workspace configuration
└── README.md             # Repository documentation
```

---

## 🛠️ Tech Stack & Services

- **Frontend**: Next.js 14 (App Router), React, NextAuth.js, Framer Motion, Lucide Icons, CSS Variables (Light/Dark themes).
- **Backend**: NestJS, `@nestjs/schedule` for background cron services (12:00 AM day rollover & auto-freeze consumption).
- **Database**: SQLite with Prisma ORM (`@trackmyhabits/database`).
- **AI Avatar Companion**: Rooney interactive speech bubble system with real-time mood calculation engine.

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client & Seed Database
```bash
npm run db:generate --workspace=packages/database
npm run db:push --workspace=packages/database
npm run db:seed --workspace=packages/database
```

### 3. Start Development Servers

**Frontend (Next.js)**:
```bash
npm run dev --workspace=apps/frontend
```
- Available at: [http://localhost:3000](http://localhost:3000)

**Backend (NestJS Cron Service)**:
```bash
npm run start:dev --workspace=apps/backend
```
- Available at: [http://localhost:3001](http://localhost:3001)

---

## 🔐 Environment & Security

- All local configuration files (`.env`, `.env.local`), database files (`*.db`), and build outputs (`.next`, `dist`, `node_modules`) are strictly ignored in `.gitignore`.
- No sensitive credentials or secrets are committed to repository history.
