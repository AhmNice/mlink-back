# Market-Link — Backend Implementation Roadmap

> Phase-by-phase, sprint-by-sprint development plan for the backend.
> 8 months · 16 sprints · Starting April 2026
> WebCortex Technologies Limited · v1.0

---

## Timeline Overview

| Phase | Sprints | Weeks | Dates | Theme |
|---|---|---|---|---|
| **1 — Foundation** | S1–S3 | 1–6 | Apr 2 – May 13 | Infrastructure, Auth, Onboarding |
| **2 — Verification + Admin** | S4–S5 | 7–10 | May 14 – Jun 10 | Admin Platform, Verification Pipeline |
| **3 — Free Tier** | S6–S7 | 11–14 | Jun 11 – Jul 8 | Market Pulse, Free Marketplace |
| **4 — Beta Listings** | S8–S9 | 15–18 | Jul 9 – Aug 5 | Listing CRUD, Search, Inquiries |
| **5 — Messaging** | S10–S11 | 19–22 | Aug 6 – Sep 2 | Encrypted Messaging |
| **6 — Services** | S12–S13 | 23–26 | Sep 3 – Sep 30 | Services Marketplace |
| **7 — Payments** | S14 | 27–28 | Oct 1 – Oct 14 | Paystack Integration |
| **8 — AI + Launch** | S15–S16 | 29–32 | Oct 15 – Nov 25 | AI Matchmaker, Testing, Launch |

---

## Phase 1 — Foundation (Sprints 1–3)

### Sprint 1 (Weeks 1–2) — Project Setup & Database

**Goal:** Development environment fully operational, database schema deployed, seed data populated.

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-1.1 | Verify Express.js project structure — routes, controllers, services, middleware folders | All directories match PROJECT_STRUCTURE.md |
| BE-1.2 | Configure environment variables — validate with Zod on server start, reject missing values | Server refuses to start with missing required env vars |
| BE-1.3 | Implement Prisma schema v1 — all enums and core models (User, UserProfile, UserDocument, RefreshToken) | `prisma migrate dev` runs clean, tables created in PostgreSQL |
| BE-1.4 | Create seed script — 20 commodities, 10 states, 7 service categories, default admin account | `npm run db:seed` populates reference data without errors |
| BE-1.5 | Set up global error handler middleware — catches all errors, formats to standard API envelope | All errors return `{ success: false, error: { code, message } }` |
| BE-1.6 | Set up structured JSON logger — no raw stack traces in output | All log entries are valid JSON with level, message, timestamp |
| BE-1.7 | Configure CORS for frontend origin | Frontend at localhost:3000 can make requests without CORS errors |
| BE-1.8 | Set up Prisma Studio for visual database browsing | `npm run db:studio` opens browser-based DB explorer |

**Deliverable:** Backend server starts, connects to PostgreSQL, serves `GET /api/v1/health` returning `{ success: true, data: { status: "ok" } }`.

---

### Sprint 2 (Weeks 3–4) — Authentication & OTP

**Goal:** Complete registration → OTP → login → JWT flow.

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-2.1 | Implement `POST /auth/register` — create user, hash password, generate OTP, send via email | User created in DB with status `PENDING_OTP`, OTP email received |
| BE-2.2 | Implement email OTP delivery via Nodemailer | OTP emails sent successfully with configured SMTP |
| BE-2.3 | Implement SMS OTP delivery via Africa's Talking (dual channel) | OTP sent to phone via Africa's Talking sandbox |
| BE-2.4 | Implement `POST /auth/verify-otp` — validate OTP, issue JWT, update status to PENDING_PROFILE | Correct OTP returns access + refresh tokens; wrong OTP increments attempts |
| BE-2.5 | Implement OTP security: 10-min expiry, 3-attempt lockout, 60s resend rate limit | Expired OTP rejected; 4th attempt rejected with lockout; resend within 60s rejected |
| BE-2.6 | Implement `POST /auth/login` — email/password authentication, return JWT | Valid credentials return tokens + user status; invalid return 401 |
| BE-2.7 | Implement `POST /auth/refresh` — exchange refresh token for new access token | Valid refresh token returns new access token; revoked token returns 401 |
| BE-2.8 | Implement JWT middleware — extract and validate Bearer token on protected routes | Protected routes reject missing/invalid tokens with 401 |
| BE-2.9 | Implement `GET /users/me/status` — return current verification status, tier, quota info | Returns accurate user state data |
| BE-2.10 | Implement referral code tracking — store referrer on registration | Referral relationship created when valid referral code provided |

**Deliverable:** A new user can register → receive OTP via email (and SMS if AT configured) → verify OTP → receive JWT → login with credentials → access protected endpoints.

---

### Sprint 3 (Weeks 5–6) — Profile & Document Upload

**Goal:** Users complete profile (S3) and upload verification documents (S4). Readiness score auto-calculates (S5).

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-3.1 | Implement `POST /users/profile` — save business profile, status → PENDING_DOCUMENTS | Profile saved, user status changes to PENDING_DOCUMENTS |
| BE-3.2 | Implement Zod validation for profile fields — all required fields enforced | Missing required fields return 422 with specific field errors |
| BE-3.3 | Implement local file upload endpoint — store files in /uploads/{userId}/ | Files saved to disk with correct naming, document record created |
| BE-3.4 | Implement `PUT /users/documents/:id/confirm` — mark upload complete, trigger S5 | Document marked as confirmed, triggers readiness score calculation |
| BE-3.5 | Implement readiness score calculation (S5) — profile completeness (30%) + document count (40%) + sector risk (30%) | Score calculated correctly for various profile/document combinations |
| BE-3.6 | Implement state transition S4 → S5 → PENDING_REVIEW — atomic with AdminAction log | Status transitions in single transaction, AdminAction record created |
| BE-3.7 | Implement email notification to admin when new user enters review queue | Admin receives email with user name and submission timestamp |
| BE-3.8 | Implement file type and size validation — PDF/JPG/PNG only, max 5MB | Invalid file types return 422; oversized files return 422 |

**Deliverable:** User completes profile → uploads 1-3 documents → readiness score auto-calculates → user enters PENDING_REVIEW state → admin receives notification.

---

## Phase 2 — Verification + Admin (Sprints 4–5)

### Sprint 4 (Weeks 7–8) — Admin Verification Queue

**Goal:** Admin can review, approve, and reject users in the verification queue.

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-4.1 | Implement admin authentication — `isAdmin` flag checked on admin routes | Non-admin users receive 403 on all /admin/* endpoints |
| BE-4.2 | Implement `requireAdmin` middleware | Middleware rejects non-admin JWTs with FORBIDDEN error |
| BE-4.3 | Implement `GET /admin/queue` — paginated verification queue, SLA flags, sorted by oldest first | Returns list with SLA breach flag on items > 24 hours |
| BE-4.4 | Implement `GET /admin/users/:id` — full profile + document download URLs | Returns complete profile data and working file download URLs |
| BE-4.5 | Implement `POST /admin/queue/:id/approve` — S6 → S7 (profile structuring) | User status → PENDING_PAYMENT, match tags assigned, AdminAction logged |
| BE-4.6 | Implement profile structuring logic — assign match tags, sector classification, tier eligibility | Tags and classification set based on profile data |
| BE-4.7 | Implement `POST /admin/queue/:id/reject` — status → REJECTED, reason required | User status → REJECTED, email sent with reason, AdminAction logged |
| BE-4.8 | Implement `POST /admin/queue/:id/request-docs` — email requesting specific documents | Email sent to user with specific document request, status stays PENDING_REVIEW |
| BE-4.9 | Implement badge assignment logic — badge level from tier + readiness score | Correct badge level assigned per the badge assignment matrix |
| BE-4.10 | Implement marketplace activation (S10) — status → MARKETPLACE_ACTIVE | User fully activated, can access all tier-appropriate features |
| BE-4.11 | Implement Free path — S7 → S9 → S10 (skip payment for FREE tier) | Free users bypass payment step and are activated directly |

**Deliverable:** Admin logs in → views queue with SLA indicators → reviews a user's profile and documents → approves → user transitions through S7 → S9 → S10 → fully active. Or rejects with reason → user receives email.

---

### Sprint 5 (Weeks 9–10) — Admin Dashboard & User Management

**Goal:** Admin has full user management and basic analytics.

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-5.1 | Implement `GET /admin/users` — paginated user list with filters (tier, status, state) | Returns filtered, paginated users |
| BE-5.2 | Implement `POST /admin/users/:id/suspend` — suspend with reason, status → SUSPENDED | User suspended, reason logged, user receives email |
| BE-5.3 | Implement `POST /admin/users/:id/change-tier` — manual tier change by admin | Tier updated, AdminAction logged |
| BE-5.4 | Implement `GET /admin/analytics/funnel` — verification pipeline drop-off data | Returns count of users at each of the 10 states |
| BE-5.5 | Implement resubmission flow — REJECTED users can re-upload documents → re-enter S4 | Rejected user re-uploads → status moves to PENDING_SCORE |
| BE-5.6 | Implement email templates — approval, rejection, request-more-docs, OTP, documents-received | All transactional emails formatted and sending correctly |

**Deliverable:** Admin can manage all users — view, filter, suspend, change tier. Analytics endpoint shows verification funnel data. Rejected users can resubmit.

---

## Phase 3 — Free Tier (Sprints 6–7)

### Sprint 6 (Weeks 11–12) — Market Pulse & Public Data

**Goal:** Free tier data endpoints live — lagged prices, business directory, trade guide metadata.

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-6.1 | Implement `GET /market-pulse/prices` — tier-based data lag (Free: 7-day, Beta: live) | Free user sees prices ≥7 days old; Beta user sees latest |
| BE-6.2 | Implement `POST /admin/market-pulse/price` — manual price entry by admin | Admin can enter price for any commodity/state pair |
| BE-6.3 | Implement `GET /admin/market-pulse/data-health` — freshness check per commodity/state | Flags pairs not updated in 48+ hours |
| BE-6.4 | Implement `GET /market-pulse/history` — price history for a commodity/state pair | Returns chronological price data for charting |
| BE-6.5 | Implement business directory API — return UserProfile data without contact details for Free users | Free users see business name, sector, state, badge but no email/phone |
| BE-6.6 | Implement tier gate middleware — `requireTier([...allowedTiers])` | Beta-only endpoints reject Free users with TIER_UPGRADE_REQUIRED |

**Deliverable:** Free user can fetch business directory data and commodity prices (7-day lag). Admin can enter and manage price data. Tier gates enforce access control.

### Sprint 7 (Weeks 13–14) — Free Tier Polish

**Goal:** All Free tier API endpoints complete and tested.

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-7.1 | Implement `GET /users/:id/profile` — read-only, contact details hidden for Free viewers | Free user viewing another profile sees no phone/email |
| BE-7.2 | Implement upgrade prompt data in tier gate responses — include feature name, pricing, tier info | TIER_UPGRADE_REQUIRED errors include what feature was attempted and pricing |
| BE-7.3 | Implement trade guides API — list guides with category filter, download URLs | Returns guide metadata with working download links |
| BE-7.4 | Integration test: complete S1 → S10 flow | End-to-end test passes: register → OTP → profile → docs → score → admin approve → activate |
| BE-7.5 | Integration test: Free tier access control | Free user blocked from messaging, inquiries, AI, listings. Allowed for prices (lagged), directory |

**Deliverable:** All Free tier functionality works end-to-end. Comprehensive integration test validates the complete user journey from registration to Free marketplace access.

---

## Phase 4 — Beta Listings (Sprints 8–9)

### Sprint 8 (Weeks 15–16) — Listing CRUD

**Goal:** Sellers can create, edit, and manage listings. Admin can moderate.

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-8.1 | Implement `POST /listings` — create listing with validation, status PENDING_REVIEW | Listing created, seller limited to 5 active, admin notified |
| BE-8.2 | Implement `PUT /listings/:id` — edit own listing, back to PENDING_REVIEW | Listing updated, seller owns the listing, status reset |
| BE-8.3 | Implement `DELETE /listings/:id` — soft delete own listing | Listing marked deleted, not returned in searches |
| BE-8.4 | Implement `GET /listings/mine` — seller's own listings with stats | Returns all seller's listings with view/inquiry counts |
| BE-8.5 | Implement listing photo upload — local storage in /uploads/listings/ | Photos saved, references stored on listing record, max 5 enforced |
| BE-8.6 | Implement `GET /admin/listings/pending` — pending listing review queue | Returns paginated pending listings for admin review |
| BE-8.7 | Implement `POST /admin/listings/:id/approve` and `/reject` | Listing status updated, seller notified via email |
| BE-8.8 | Implement listing expiry check — daily identification of expired listings | Listings past validUntil flagged as EXPIRED |

**Deliverable:** Seller creates listing with photos → admin approves/rejects → approved listing visible. Seller can edit, pause, delete own listings.

### Sprint 9 (Weeks 17–18) — Search & Inquiries

**Goal:** Full-text search and inquiry flow operational.

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-9.1 | Add tsvector column and GIN index via raw SQL migration | Search vector populated on insert/update, GIN index active |
| BE-9.2 | Implement `GET /listings/search` — full-text search with filters and pagination | Search returns relevant results ranked by relevance |
| BE-9.3 | Implement filter: commodity type, location state, price range, delivery terms | Filters narrow results correctly, combinable |
| BE-9.4 | Implement sort: relevance, date (newest), price ascending, price descending | Sort order applies correctly across all options |
| BE-9.5 | Implement `POST /inquiries` — create inquiry with quota enforcement | Inquiry created, quota checked (5/month for buyer), seller notified |
| BE-9.6 | Implement `GET /inquiries` — list sent and received inquiries | Returns inquiries filtered by role (buyer sees sent, seller sees received) |
| BE-9.7 | Implement `PUT /inquiries/:id/status` — update inquiry status | Status transitions enforced (SENT → VIEWED → RESPONDED → etc.) |
| BE-9.8 | Implement inquiry quota tracking — monthly counter per user | 6th inquiry returns 429 with quota info and upgrade prompt |

**Deliverable:** Buyer searches listings → finds results with full-text search → sends inquiry (within quota) → seller receives notification → seller responds → inquiry status tracked.

---

## Phase 5 — Messaging (Sprints 10–11)

### Sprint 10 (Weeks 19–20) — Core Messaging

**Goal:** Encrypted message exchange between verified users.

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-10.1 | Implement message encryption utility — encrypt before write, decrypt on read | Messages stored as cipher text, readable only via API |
| BE-10.2 | Implement deterministic thread ID generation — sorted(userId1, userId2) | Same thread ID regardless of who initiates |
| BE-10.3 | Implement `POST /messages` — encrypt and store message | Message stored encrypted, recipient notified |
| BE-10.4 | Implement `GET /messages/thread/:userId` — decrypt and return thread | Messages returned decrypted, chronologically ordered |
| BE-10.5 | Implement `GET /messages/threads` — list all threads with last message + unread count | Thread list with preview and accurate unread counts |
| BE-10.6 | Implement file attachment support — attach files to messages (max 10MB) | Attachments stored and retrievable |

**Deliverable:** Two users can exchange encrypted messages. Messages stored encrypted at rest. Thread list shows unread counts.

### Sprint 11 (Weeks 21–22) — Messaging Polish & Detection

**Goal:** Contact-sharing detection, read receipts, notifications.

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-11.1 | Implement contact-sharing pattern detection (first 3 messages per thread) | Phone numbers, emails, WhatsApp mentions detected and flagged |
| BE-11.2 | Implement read receipt tracking — update readAt when recipient fetches thread | readAt timestamp set correctly on message read |
| BE-11.3 | Implement email notifications for new messages | Recipient receives email when a new message arrives |
| BE-11.4 | Integration test: full messaging flow with encryption verification | Messages encrypted in DB, decrypted correctly, contacts detected |

**Deliverable:** Complete messaging system with encryption, contact detection, read tracking, and email notifications.

---

## Phase 6 — Services (Sprints 12–13)

### Sprint 12 (Weeks 23–24) — Service Listings

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-12.1 | Add service marketplace tables to Prisma schema (ServiceListing, ServiceBooking) | Migration runs cleanly, tables created |
| BE-12.2 | Implement service listing CRUD — create, read, update, delete for providers | CRUD operations work with proper validation |
| BE-12.3 | Implement `GET /services/search` — search by category, state, price range | Search returns relevant service providers |
| BE-12.4 | Implement TIS score calculation and `GET /users/me/tis` | TIS score calculated from 5 components, returned with breakdown |

### Sprint 13 (Weeks 25–26) — Bookings & Commission

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-13.1 | Implement `POST /services/bookings` — create booking request | Booking created with pending status, provider notified |
| BE-13.2 | Implement booking status flow — pending → confirmed → completed/disputed | Status transitions enforced correctly |
| BE-13.3 | Implement commission calculation — 7% platform, 93% provider | Commission amounts calculated correctly in kobo |
| BE-13.4 | Implement TIS contribution on booking completion — +5 provider, +2 buyer | TIS scores updated after booking completed |

**Deliverable:** Service provider lists services → buyer finds and books → booking confirmed → completed → TIS updated for both.

---

## Phase 7 — Payments (Sprint 14)

### Sprint 14 (Weeks 27–28) — Paystack Integration

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-14.1 | Implement `POST /payments/subscription` — create Paystack payment reference | Returns reference for frontend Paystack popup |
| BE-14.2 | Implement `POST /payments/webhook` — signature verification + event processing | Unsigned requests rejected with 401 |
| BE-14.3 | Implement charge.success handler — update tier → badge → marketplace activation | User tier, badge, and status all update correctly within 30 seconds |
| BE-14.4 | Implement subscription.disable handler — downgrade tier → notify user | Tier downgraded, user receives email notification |
| BE-14.5 | Implement invoice.payment_failed handler — mark at risk → notify user | Subscription flagged, user receives warning email |
| BE-14.6 | Implement Paystack subaccount creation for service providers (split payments) | 93/7 split configured correctly per provider |
| BE-14.7 | Implement `GET /payments/history` — payment history for the user | Returns chronological payment records |
| BE-14.8 | Implement `GET /admin/analytics/mrr` — monthly recurring revenue by tier | Returns accurate MRR breakdown |

**Deliverable:** User selects tier → pays via Paystack → webhook processes → tier assigned → badge assigned → marketplace activated. Service payments split 93/7.

---

## Phase 8 — AI + Launch (Sprints 15–16)

### Sprint 15 (Weeks 29–30) — AI Matchmaker

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-15.1 | Implement AWS Bedrock client — SDK setup, invoke helper, error handling | Test Bedrock call returns valid response |
| BE-15.2 | Implement profile anonymisation — strip all PII before prompt construction | No business names, emails, phones, NIN, BVN in prompts |
| BE-15.3 | Implement AI matchmaker prompt template | Prompt produces valid JSON with scored matches |
| BE-15.4 | Implement `POST /ai/matches/refresh` — on-demand match generation | Returns top 10 matches with scores and reasoning |
| BE-15.5 | Implement `GET /ai/matches` — return stored unexpired matches | Returns current matches, excludes expired |
| BE-15.6 | Implement match refresh limit — max 2 per user per day | 3rd refresh attempt returns 429 |
| BE-15.7 | Implement `PUT /ai/matches/:id/feedback` — thumbs up/down storage | Feedback stored, influences next generation |
| BE-15.8 | Implement AI quota tracking — per billing cycle enforcement | Quota increments, 429 on limit reached |

### Sprint 16 (Weeks 31–32) — AI Queries, Testing & Launch

| ID | Task | Acceptance Criteria |
|---|---|---|
| BE-16.1 | Implement `POST /ai/market-query` — market intelligence answers | Answers grounded in platform price data, no hallucination |
| BE-16.2 | Implement `POST /ai/service-connector` — NLP service provider matching | Returns top 3 providers based on query intent |
| BE-16.3 | Implement fallback — TIS-sorted results when AI confidence is low | Low-confidence matches fill from TIS ranking |
| BE-16.4 | Security audit — review all IAM, credentials, injection vectors | Zero P0 security findings |
| BE-16.5 | Load test — 100 concurrent users across all endpoints | All endpoints < 1s under load |
| BE-16.6 | Bug triage — fix all P0 bugs from testing | Zero P0 bugs remaining |
| BE-16.7 | Production deployment preparation | Production environment config documented |

**Deliverable:** AI features fully operational. All tests passing. Security audit complete. Ready for controlled beta launch.

---

## Sprint Dependencies

```
S1 (DB Setup) → S2 (Auth) → S3 (Profile/Docs)
                     ↓
                S4 (Admin Queue) → S5 (Admin Dashboard)
                     ↓
                S6 (Market Pulse) → S7 (Free Tier)
                     ↓
                S8 (Listings) → S9 (Search/Inquiries)
                     ↓
                S10 (Messaging) → S11 (Messaging Polish)
                     ↓
                S12 (Services) → S13 (Bookings)
                     ↓
                S14 (Payments)
                     ↓
                S15 (AI) → S16 (Launch)
```

---

*Market-Link · Backend Implementation Roadmap · WebCortex Technologies Limited · v1.0 · April 2026*
