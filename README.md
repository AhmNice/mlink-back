# Market-Link — Backend

> **Nigeria's Verified B2B Trade & Investment Intelligence Platform**
> WebCortex Technologies Limited · Backend Service

---

## Overview

Market-Link is a verified B2B trade and investment intelligence platform built for the Nigerian market. This repository contains the backend API service that powers the entire platform — authentication, verification pipeline, listings, messaging, payments, AI matching, and administration.

The backend is built as a **REST API** using Express.js for local development, designed for future deployment to AWS Lambda for production. It serves as the single source of truth for all business logic, data validation, tier gating, and third-party integrations.

---

## Architecture

### Local Development

The backend runs as a standard Express.js HTTP server during development. All routes, middleware, and business logic are structured in a modular fashion that maps cleanly to individual Lambda functions when deployed to production.

### Production Deployment (Future)

In production, each route handler maps to an individual AWS Lambda function behind API Gateway. The Serverless Framework handles this mapping. The codebase is designed with this dual-mode deployment in mind — handlers are stateless, dependencies are injected, and no server-specific state is assumed.

### System Architecture Overview

```
Users / Browsers (Mobile-first: 375px / 768px / 1280px)
        │
        │ HTTPS
        ▼
Next.js 16 Frontend (Vercel / AWS Amplify)
        │
        │ REST API calls (JWT Bearer)
        ▼
Express.js API Server (local) / API Gateway + Lambda (production)
        │
        ├── PostgreSQL (Prisma ORM)
        ├── File Storage (local /uploads → S3 in production)
        ├── Email (Nodemailer SMTP → SES in production)
        ├── SMS OTP (Africa's Talking)
        ├── Payments (Paystack)
        └── AI (AWS Bedrock — Phase 8)
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | 20.x LTS | Server runtime |
| Framework | Express.js | 5.x | HTTP server, routing, middleware |
| Language | TypeScript | 6.x | Type safety |
| ORM | Prisma | 7.x | Database access, migrations, schema management |
| Database | PostgreSQL | 15.x+ | Primary data store |
| Authentication | JSON Web Tokens | — | Stateless auth via `jsonwebtoken` |
| Password Hashing | bcrypt | 6.x | Secure password storage |
| Validation | Zod | 4.x | Request body and schema validation |
| Email | Nodemailer | 8.x | Transactional email (SMTP locally, SES in production) |
| SMS / OTP | Africa's Talking | — | Nigerian phone number OTP delivery |
| Payments | Paystack | — | NGN subscriptions, split payments |
| AI | AWS Bedrock (Claude) | — | Matchmaker, market queries (Phase 8) |
| Linting | ESLint + Prettier | — | Code quality enforcement |
| Git Hooks | Husky + lint-staged | — | Pre-commit checks |

---

## Prerequisites

- **Node.js** 20 LTS or later
- **PostgreSQL** 15.x or later running locally
- **npm** 10.x or later
- **Git** configured with access to the webcortex organisation

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/webcortex/mlink-back.git
cd mlink-back
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your local PostgreSQL credentials. See the **Environment Variables** section below for details.

### 4. Run Database Migrations

```bash
npm run db:migrate:dev
```

### 5. Seed Reference Data

```bash
npm run db:seed
```

This seeds the 20 MVP commodities, 10 launch states, service categories, and a default admin account.

### 6. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000/api/v1`.

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start development server with hot reload |
| `build` | `npm run build` | Compile TypeScript and generate Prisma client |
| `typecheck` | `npm run typecheck` | Run TypeScript compiler without emitting |
| `lint` | `npm run lint` | Run ESLint on all TypeScript files |
| `lint:fix` | `npm run lint:fix` | Auto-fix ESLint issues |
| `format` | `npm run format` | Format all files with Prettier |
| `db:generate` | `npm run db:generate` | Regenerate Prisma client |
| `db:push` | `npm run db:push` | Push schema changes without creating a migration |
| `db:migrate:dev` | `npm run db:migrate:dev` | Create and apply a new migration |
| `db:migrate:deploy` | `npm run db:migrate:deploy` | Apply pending migrations (staging/production) |
| `db:migrate:status` | `npm run db:migrate:status` | Check migration status |
| `db:studio` | `npm run db:studio` | Open Prisma Studio (visual database browser) |
| `db:seed` | `npm run db:seed` | Seed reference data into the database |
| `db:reset` | `npm run db:reset` | Reset database and reapply all migrations + seed |

---

## Environment Variables

| Variable | Required | Description | Example |
|---|---|---|---|
| `PORT` | Yes | Server port | `5000` |
| `NODE_ENV` | Yes | Environment mode | `development` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/mlink_db?schema=public` |
| `JWT_SECRET` | Yes | Secret key for signing JWTs (min 32 chars) | Random string |
| `JWT_EXPIRES_IN` | Yes | Access token expiry duration | `7d` |
| `CLIENT_URL` | Yes | Frontend URL for CORS | `http://localhost:3000` |
| `SMTP_HOST` | Yes | SMTP server for email OTP | `smtp.gmail.com` |
| `SMTP_PORT` | Yes | SMTP port | `587` |
| `SMTP_USER` | Yes | SMTP authentication email | — |
| `SMTP_PASS` | Yes | SMTP password or app password | — |
| `SMTP_FROM` | Yes | Sender email address | `noreply@marketlink.ng` |
| `AFRICAS_TALKING_API_KEY` | Phase 1+ | Africa's Talking API key | — |
| `AFRICAS_TALKING_USERNAME` | Phase 1+ | Africa's Talking username | — |
| `PAYSTACK_SECRET_KEY` | Phase 7+ | Paystack secret key | `sk_test_xxx` |
| `PAYSTACK_WEBHOOK_SECRET` | Phase 7+ | Paystack webhook signing secret | — |

---

## API Base URL

```
Local Development:  http://localhost:5000/api/v1
Staging:            https://api-staging.marketlink.ng/v1
Production:         https://api.marketlink.ng/v1
```

All endpoints are prefixed with `/api/v1`. See `docs/API_CONTRACT.md` for the complete endpoint reference.

---

## Standard API Response Format

Every API response follows a consistent envelope structure. The frontend team depends on this contract.

**Success:**
```json
{
  "success": true,
  "data": { },
  "meta": {
    "timestamp": "2026-04-02T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is already registered",
    "field": "email"
  },
  "meta": {
    "timestamp": "2026-04-02T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## Development Workflow

### Git Branching

```
main          → production deployment (protected, PR required)
staging       → staging deployment (protected, PR required)
feature/*     → feature branches (from staging, merge back to staging)
hotfix/*      → emergency fixes (from main, merge to main + staging)
```

### Branch Naming Convention

```
feature/BE-1.5-register-endpoint
feature/BE-3.4-admin-verification-queue
hotfix/BE-webhook-sig-validation
```

### Commit Message Format

```
feat(auth): add OTP verification endpoint
fix(listings): correct search filter for state
test(payments): add webhook signature bypass test
docs(api): update Postman collection for /ai endpoints
chore(deps): update Prisma to 7.7.0
```

### Pull Request Requirements

- Title references ticket ID: `[BE-5.5] Full-text listing search`
- Must pass all CI checks (lint, typecheck)
- Minimum 1 reviewer from same team
- All `TODO:` and `FIXME:` comments addressed or tracked
- No `console.log` in production code
- No hardcoded values that should be environment variables

---

## Documentation Index

| Document | Description |
|---|---|
| [System Analysis](docs/SYSTEM_ANALYSIS.md) | Requirements, constraints, use cases, compliance |
| [Database Design](docs/DATABASE_DESIGN.md) | Schema, entities, relationships, migrations |
| [API Contract](docs/API_CONTRACT.md) | Complete endpoint specification |
| [Modules](docs/MODULES.md) | Backend module breakdown and responsibilities |
| [Project Structure](docs/PROJECT_STRUCTURE.md) | Directory tree with file descriptions |
| [Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md) | Phase-by-phase sprint plan |
| [Tracker](TRACKER.md) | Living sprint progress tracker |

---

## Security Principles

1. **All endpoints behind JWT auth** except `/auth/register`, `/auth/login`, `/auth/verify-otp`, and `/payments/webhook`
2. **Paystack webhook validates signature** before any processing
3. **PII fields (NIN, BVN, bank account)** encrypted before database write
4. **Messages encrypted at rest** — decrypted only in the API layer, never exposed raw
5. **No credentials in code** — all secrets in `.env` locally, AWS Secrets Manager in production
6. **Structured logging only** — no raw stack traces or PII in logs
7. **User PII never sent to AI services** — anonymised IDs only
8. **OTP rate limiting** — 3 attempts per 15-minute window, 10-minute expiry

---

*Market-Link Backend · WebCortex Technologies Limited · April 2026*