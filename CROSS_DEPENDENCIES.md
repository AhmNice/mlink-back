# Market-Link — Cross-Team Dependencies

> Checklist showing backend–frontend sprint dependencies.
> Neither team should start a dependent task until the prerequisite is marked ✅.
> WebCortex Technologies Limited · v1.0 · April 2026

---

## How to Use This Document

1. Before starting a sprint, check this document for prerequisites
2. The **backend team** marks their deliverables as ✅ when the endpoint/feature is deployed and testable
3. The **frontend team** should not integrate against a backend feature until it's marked ✅ here
4. If a backend deliverable is delayed, the frontend team builds with **mocked API responses** and notes it in their TRACKER.md

---

## Phase 1 — Foundation (Sprints 1–3)

### Sprint 1 — Project Setup

| # | Backend Deliverable | Status | Frontend Dependency |
|---|---|---|---|
| D-1.1 | PostgreSQL database running with initial schema | 🔲 | FE can start independently — no BE dependency for S1 |
| D-1.2 | `GET /api/v1/health` returns `{ success: true }` | 🔲 | FE can verify API client (Axios) connectivity |
| D-1.3 | Seed data populated (commodities, states, categories) | 🔲 | FE can use `lib/constants.ts` locally until verified against BE |

### Sprint 2 — Authentication

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-2.1 | `POST /auth/register` — user creation, OTP sent | 🔲 | FE Register page API integration | FE-2.3 |
| D-2.2 | `POST /auth/verify-otp` — OTP validation, JWT issued | 🔲 | FE OTP page API integration | FE-2.4 |
| D-2.3 | `POST /auth/login` — email/password, JWT returned | 🔲 | FE Login page, NextAuth setup | FE-2.5 |
| D-2.4 | `POST /auth/refresh` — refresh token rotation | 🔲 | FE Axios interceptor auto-refresh | FE-1.8 |
| D-2.5 | `GET /users/me/status` — verification status + tier | 🔲 | FE middleware redirect logic | FE-2.6 |
| D-2.6 | Email OTP delivery working (Nodemailer) | 🔲 | FE can test full register → OTP flow | FE-2.4 |

### Sprint 3 — Profile & Documents

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-3.1 | `POST /users/profile` — save business profile | 🔲 | FE Profile form API integration | FE-3.2 |
| D-3.2 | `POST /users/documents` — file upload URL generation | 🔲 | FE Document upload flow | FE-3.3, FE-3.4 |
| D-3.3 | `PUT /users/documents/:id/confirm` — upload confirmation | 🔲 | FE upload → confirm flow | FE-3.4 |
| D-3.4 | Readiness score auto-calculation (S5) | 🔲 | FE Pending page shows score | FE-3.6 |
| D-3.5 | Status transitions S3 → S4 → S5 → PENDING_REVIEW | 🔲 | FE Pending page polling detects transitions | FE-3.7 |

---

## Phase 2 — Verification + Admin (Sprints 4–5)

### Sprint 4 — Admin Verification Queue

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-4.1 | Admin authentication (isAdmin on JWT) | 🔲 | FE admin auth guard | FE-4.2 |
| D-4.2 | `GET /admin/queue` — paginated queue with SLA flags | 🔲 | FE queue list page | FE-4.3 |
| D-4.3 | `GET /admin/users/:id` — profile + document URLs | 🔲 | FE individual review page | FE-4.4 |
| D-4.4 | `POST /admin/queue/:id/approve` — triggers S7+ flow | 🔲 | FE Approve action in modal | FE-4.6 |
| D-4.5 | `POST /admin/queue/:id/reject` — rejection with reason | 🔲 | FE Reject action in modal | FE-4.6 |
| D-4.6 | Full S1→S10 pipeline functional (Free path) | 🔲 | FE can test complete onboarding flow | FE-3.7, FE-3.8 |

### Sprint 5 — Admin Dashboard

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-5.1 | `GET /admin/users` — user list with filters | 🔲 | FE user management page | FE-5.2 |
| D-5.2 | `POST /admin/users/:id/suspend` | 🔲 | FE suspend button | FE-5.3 |
| D-5.3 | `GET /admin/analytics/funnel` — pipeline data | 🔲 | FE funnel chart | FE-5.1 |
| D-5.4 | Rejection resubmission flow (S6 → S4) | 🔲 | FE rejected page → resubmit | FE-3.8 |

---

## Phase 3 — Free Tier (Sprints 6–7)

### Sprint 6 — Market Pulse & Directory

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-6.1 | `GET /market-pulse/prices` — tier-based lag logic | 🔲 | FE Market Pulse page, DataLagBanner | FE-6.3 |
| D-6.2 | `POST /admin/market-pulse/price` — manual entry | 🔲 | FE admin price management page | FE (admin) |
| D-6.3 | Business directory API — profiles without contacts for Free | 🔲 | FE marketplace page, BusinessCard | FE-6.1, FE-6.2 |
| D-6.4 | Tier gate middleware — `TIER_UPGRADE_REQUIRED` responses | 🔲 | FE UpgradePrompt integration | FE-7.4 |

### Sprint 7 — Free Tier Polish

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-7.1 | `GET /users/:id/profile` — contact hidden for Free | 🔲 | FE profile view page | FE-7.1 (part) |
| D-7.2 | Trade guides API — list + download | 🔲 | FE Knowledge Hub page | FE-7.1 |
| D-7.3 | Upgrade prompt data in tier gate errors | 🔲 | FE UpgradePrompt content | FE-5.4 |

---

## Phase 4 — Beta Listings (Sprints 8–9)

### Sprint 8 — Listing CRUD

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-8.1 | `POST /listings` — create with validation | 🔲 | FE listing creation form | FE-8.1 |
| D-8.2 | `PUT /listings/:id` — update own listing | 🔲 | FE listing edit page | FE-8.4 |
| D-8.3 | `GET /listings/mine` — seller's listings | 🔲 | FE My Listings dashboard | FE-8.3 |
| D-8.4 | Listing photo upload endpoint | 🔲 | FE multi-photo upload | FE-8.2 |
| D-8.5 | Admin listing moderation endpoints | 🔲 | FE admin listing review page | FE-8.5 |

### Sprint 9 — Search & Inquiries

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-9.1 | `GET /listings/search` — full-text + filters + pagination | 🔲 | FE search page | FE-9.1 |
| D-9.2 | `POST /inquiries` — create with quota enforcement | 🔲 | FE InquiryModal | FE-9.3 |
| D-9.3 | `GET /inquiries` — list sent/received | 🔲 | FE Inquiries page | FE-9.4 |
| D-9.4 | Quota tracking for inquiries | 🔲 | FE InquiryQuotaDisplay | FE-9.5 |

---

## Phase 5 — Messaging (Sprints 10–11)

### Sprint 10 — Core Messaging

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-10.1 | `POST /messages` — encrypt and store | 🔲 | FE message send functionality | FE-10.2 |
| D-10.2 | `GET /messages/thread/:userId` — decrypt and return | 🔲 | FE MessageThread view | FE-10.2 |
| D-10.3 | `GET /messages/threads` — list with unread counts | 🔲 | FE ThreadList | FE-10.1 |

### Sprint 11 — Messaging Polish

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-11.1 | Contact-sharing detection (first 3 messages) | 🔲 | FE ContactWarningBanner logic | FE-11.2 |
| D-11.2 | Read receipt updates | 🔲 | FE read indicators on messages | FE-10.3 |
| D-11.3 | File attachment support | 🔲 | FE AttachmentUpload | FE-11.1 |

---

## Phase 6 — Services (Sprints 12–13)

### Sprint 12 — Service Listings

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-12.1 | Service listing CRUD endpoints | 🔲 | FE service creation form | FE-12.3 |
| D-12.2 | `GET /services/search` — search by category/state | 🔲 | FE service directory | FE-12.1 |
| D-12.3 | `GET /users/me/tis` — TIS score breakdown | 🔲 | FE TIS score page | FE-12.4 |

### Sprint 13 — Bookings

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-13.1 | `POST /services/bookings` — create booking | 🔲 | FE booking flow | FE-13.1 |
| D-13.2 | Booking status updates | 🔲 | FE booking tracking | FE-13.2 |
| D-13.3 | Commission calculation (93/7 split) | 🔲 | FE booking confirmation | FE-13.3 |

---

## Phase 7 — Payments (Sprint 14)

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-14.1 | `POST /payments/subscription` — Paystack reference | 🔲 | FE Paystack popup integration | FE-14.2 |
| D-14.2 | Webhook processing — tier update on payment | 🔲 | FE post-payment status polling | FE-14.3 |
| D-14.3 | Price alert endpoints | 🔲 | FE Market Pulse Beta view | FE-14.5 |

---

## Phase 8 — AI + Launch (Sprints 15–16)

### Sprint 15 — AI Features

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-15.1 | `GET /ai/matches` — stored match list | 🔲 | FE MatchList page | FE-15.1 |
| D-15.2 | `POST /ai/matches/refresh` — on-demand generation | 🔲 | FE MatchRefreshButton | FE-15.3 |
| D-15.3 | `PUT /ai/matches/:id/feedback` — thumbs up/down | 🔲 | FE MatchCard feedback | FE-15.2 |
| D-15.4 | AI quota tracking | 🔲 | FE QuotaMeter | FE-15.5 |

### Sprint 16 — Launch

| # | Backend Deliverable | Status | Frontend Dependency | FE Task Blocked |
|---|---|---|---|---|
| D-16.1 | `POST /ai/market-query` — AI market intelligence | 🔲 | FE AIQueryInput + result | FE-15.4 |
| D-16.2 | All endpoints stable under load | 🔲 | FE E2E tests can run reliably | FE-16.1–16.3 |

---

## Status Legend

| Icon | Meaning |
|---|---|
| 🔲 | Not started |
| 🟡 | In progress |
| ✅ | Complete and testable |
| 🔴 | Blocked / delayed |

---

*Market-Link · Cross-Team Dependencies · WebCortex Technologies Limited · April 2026*
