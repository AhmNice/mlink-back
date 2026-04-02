# Market-Link — Backend Modules

> Technical breakdown of every backend module and its responsibilities.
> WebCortex Technologies Limited · v1.0 · April 2026

---

## Module Index

| # | Module | Phase | Sprint | Priority | Status |
|---|---|---|---|---|---|
| M1 | Authentication & OTP | Phase 1 | S2–S3 | P0 | 🔲 Not started |
| M2 | 10-State Verification Pipeline | Phase 1–2 | S3–S5 | P0 | 🔲 Not started |
| M3 | Admin Platform | Phase 2–3 | S4–S7 | P0 | 🔲 Not started |
| M4 | Free Tier Marketplace | Phase 3 | S6–S7 | P0 | 🔲 Not started |
| M5 | Beta Verified Listings | Phase 4 | S8–S9 | P0 | 🔲 Not started |
| M6 | Buyer Search & Inquiry | Phase 4 | S9 | P0 | 🔲 Not started |
| M7 | Secure Messaging | Phase 5 | S10–S11 | P0 | 🔲 Not started |
| M8 | Market Pulse | Phase 3 | S6 | P0 | 🔲 Not started |
| M9 | Services Marketplace | Phase 6 | S12–S13 | P1 | 🔲 Not started |
| M10 | Paystack Subscriptions | Phase 7 | S14 | P0 | 🔲 Not started |
| M11 | AI Matchmaker | Phase 8 | S15–S16 | P1 | 🔲 Not started |
| M12 | AI Market Query | Phase 8 | S16 | P1 | 🔲 Not started |
| M13 | AI Service Connector | Phase 8 | S16 | P1 | 🔲 Not started |
| M14 | Trade Intelligence Score | Phase 6 | S12 | P1 | 🔲 Not started |
| M15 | Referral System | Phase 1 | S2 | P2 | 🔲 Not started |

---

## M1 — Authentication & OTP

### Purpose
Establish a verified identity for every user before they enter the platform. This is the gateway for every user — no one interacts with the system without completing registration and OTP verification.

### Responsibilities
- Create user records with email, phone, and hashed password
- Generate cryptographically random 6-digit OTP codes
- Send OTP via email (Nodemailer) and SMS (Africa's Talking)
- Validate OTP with attempt tracking and lockout enforcement
- Issue JWT access tokens and refresh tokens
- Handle token refresh and logout (revoke refresh tokens)

### Endpoints Owned
- `POST /auth/register` — Creates user, sends OTP
- `POST /auth/verify-otp` — Validates OTP, issues JWT
- `POST /auth/login` — Email/password login
- `POST /auth/refresh` — Token refresh
- `POST /auth/logout` — Revoke refresh token
- `POST /auth/resend-otp` — Resend OTP (rate limited)

### OTP Security Rules
- OTP is 6-digit numeric, generated with `crypto.randomInt`
- Expires 10 minutes after send
- Maximum 3 attempts per 15-minute window
- After 3 failures, 15-minute lockout enforced
- Resend rate limited to 1 per 60 seconds per phone number
- Dual delivery: email (always) + SMS (when Africa's Talking credentials available)

### Database Tables
- `User` (otpCode, otpExpiresAt, otpAttempts, otpLastSentAt fields)
- `RefreshToken`

### External Dependencies
- Nodemailer (SMTP email)
- Africa's Talking SDK (SMS)

### Deliverable Test
A new user can register → receive OTP by email → verify OTP → receive JWT → login with email/password → receive new JWT.

---

## M2 — 10-State Verification Pipeline

### Purpose
The trust engine of the platform. Every user passes through all 10 states sequentially before accessing the marketplace. This module enforces the state machine.

### Responsibilities
- Enforce sequential state transitions (no state can be skipped)
- Validate that a user is in the correct state before allowing actions
- Handle profile submission (S3) and document upload (S4)
- Calculate readiness score automatically after document confirmation (S5)
- Route users to admin review queue (S5 → S6)
- Process admin decisions: approve → S7, reject → REJECTED
- Execute profile structuring on approval (S7) — assign match tags, tier eligibility
- Handle Free path (skip payment → S9 → S10) and Beta path (payment → S8 → S9 → S10)
- Assign badge levels based on tier and readiness score (S9)
- Activate marketplace access (S10)

### State Machine Rules
- `verificationStatus` is the single source of truth
- Every transition is atomic (wrapped in a database transaction)
- Every transition is logged in `AdminAction` table
- No backward transitions except REJECTED → resubmit → S4

### Readiness Score (S5)
Automatically calculated from three components:
- Profile completeness (30%): required fields filled ÷ total required fields
- Document count (40%): min(uploaded docs ÷ 3, 1.0)
- Sector risk rating (30%): configured per sector (0.70–0.95)

### Database Tables
- `User` (verificationStatus, readinessScore, badgeLevel, tier)
- `UserProfile`
- `UserDocument`
- `AdminAction`

### Deliverable Test
A user can complete registration → OTP → profile → document upload → score auto-calculates → admin reviews → user is activated with correct badge level.

---

## M3 — Admin Platform

### Purpose
Operational backbone of Market-Link. Without the admin platform, the verification model cannot function and listings cannot go live.

### Responsibilities
- Admin authentication and authorization (`isAdmin` flag on JWT)
- Verification queue management (paginated, sorted by submission date, SLA flags)
- Individual user review with document preview/download
- Approve/reject/request-more-docs decision actions
- Listing moderation queue (approve/reject new listings)
- Market Pulse data entry (manual price input for MVP)
- Data freshness monitoring (flag commodity/state pairs not updated in 48 hours)
- Analytics: verification funnel, MRR, AI usage, churn

### Admin SLA
- 24-hour review target from document submission
- Queue items exceeding 24 hours are flagged with `slaBreached: true`
- Admin notified via email if queue grows beyond 10 unreviewed items

### Endpoints Owned
All endpoints under `/admin/*` — see API Contract for full list.

### Database Tables
- `AdminAction` (audit log)
- Reads from: `User`, `UserProfile`, `UserDocument`, `Listing`, `CommodityPrice`, `Subscription`

### Deliverable Test
Admin can log in → view verification queue with SLA indicators → open a user's review → preview documents → approve/reject with reason → decision logged and user notified.

---

## M4 — Free Tier Marketplace

### Purpose
Top of the conversion funnel. Every feature is designed to demonstrate platform value while creating upgrade desire for Beta features.

### Responsibilities
- Serve business directory data (name, sector, state, badge level, commodity tags)
- Enforce contact detail hiding for Free users
- Serve Market Pulse data with 7-day delay for Free users
- Provide trade guide metadata and download links
- Return `TIER_UPGRADE_REQUIRED` error with specific feature name when Free users attempt gated actions

### Access Control
Free users can:
- Browse business directory (no contact details)
- View commodity prices (7 days delayed)
- Download trade guides
- View their own profile

Free users cannot:
- Send inquiries
- Access messaging
- View live prices
- Use AI features
- Create listings

### Database Tables
- Reads from: `UserProfile`, `CommodityPrice`

### Deliverable Test
A Free user can browse the business directory → see filtered results → attempt to contact a business → see upgrade prompt with pricing.

---

## M5 — Beta Verified Listings

### Purpose
Enable verified sellers to list commodities for sale and buyers to discover them through search.

### Responsibilities
- Listing CRUD (create, read, update, soft-delete) for Beta Sellers
- Enforce listing limit (5 active per Beta Seller)
- Manage listing lifecycle: DRAFT → PENDING_REVIEW → LIVE → PAUSED / EXPIRED / REJECTED
- Handle listing photo storage (local /uploads in dev, S3 in production)
- Admin listing moderation (approve/reject with reason)
- Full-text search using PostgreSQL `tsvector` with GIN index
- Filter by commodity, state, price range, delivery terms
- Sort by relevance, date, price ascending/descending
- Increment viewCount and inquiryCount counters

### Listing Validation
- Title: 10–100 characters
- Description: 50–2000 characters
- Either `pricePerUnit` or `priceOnRequest` must be set
- Maximum 5 photos
- Validity maximum 90 days from creation
- Commodity must be from the 20 MVP list
- State must be from the 10 launch states

### Database Tables
- `Listing`

### Deliverable Test
A seller creates a listing → admin approves it → listing appears in buyer search results → buyer can view listing details → viewCount increments.

---

## M6 — Buyer Search & Inquiry

### Purpose
Enable Beta Buyers to discover listings and express structured interest to sellers.

### Responsibilities
- Inquiry creation with quota enforcement (5/month for Active Buyer, unlimited for Power Buyer)
- Inquiry status tracking (SENT → VIEWED → RESPONDED → DEAL_INITIATED → CLOSED)
- Email notification to seller on new inquiry
- Inquiry listing with filtering by status and role (sent vs received)

### Quota Enforcement
Monthly inquiry count tracked per user. Counter resets on the 1st of each month. When quota is exceeded, the API returns `QUOTA_EXCEEDED` with remaining quota info and upgrade prompt data.

### Database Tables
- `Inquiry`

### Deliverable Test
A buyer sends an inquiry on a listing → seller receives email notification → seller views inquiry (status updates to VIEWED) → seller responds (status updates to RESPONDED).

---

## M7 — Secure Messaging

### Purpose
Provide encrypted, on-platform communication between verified businesses. Designed to keep negotiations on-platform rather than moving to WhatsApp/email.

### Responsibilities
- Encrypt messages before database write (application-level encryption)
- Decrypt messages on read (API layer only — encrypted at rest)
- Generate deterministic thread IDs from sorted user ID pairs
- Track read status per message
- Support file attachments (PDF, images, max 10MB)
- Monitor first 3 messages per thread for off-platform contact patterns
- List threads with last message preview and unread count

### Contact-Sharing Detection
Messages in the first 3 of a thread are checked against patterns:
- Nigerian mobile numbers (0[789]01XXXXXXX)
- International format (+234XXXXXXXXXX)
- Email addresses
- "WhatsApp" or "Telegram" mentions

Detected messages are flagged but not blocked — flagging is for analytics and admin awareness.

### Database Tables
- `Message`

### Deliverable Test
Two verified users can exchange encrypted messages → messages are stored encrypted in DB → messages are decrypted correctly on read → unread count is accurate → contact-sharing patterns are flagged.

---

## M8 — Market Pulse

### Purpose
Provide commodity price intelligence with tiered access. This is both a value feature and a Free-to-Beta conversion mechanism.

### Responsibilities
- Store commodity price data from multiple sources
- Serve prices with tier-based data lag (Free: 7 days, Beta: live)
- Support admin manual price entry (MVP fallback)
- Track data freshness per commodity/state pair
- Price alerts: user sets target + direction → daily cron checks → email notification

### 20 MVP Commodities
sesame, hibiscus, groundnut, palm-oil, cassava, cocoa, cashew, sorghum, ginger, turmeric, cowpea, maize, soybean, cotton, rubber, timber, iron-ore, granite, limestone, crude-palm-kernel

### 10 Launch States
Lagos, Kano, Abuja, Rivers, Ogun, Kaduna, Oyo, Katsina, Anambra, Delta

### Database Tables
- `CommodityPrice`
- `PriceAlert`

### Deliverable Test
Admin enters prices for sesame in Kano → Beta user sees current price → Free user sees the same price but only after 7 days → User sets a price alert → price crosses threshold → user receives email.

---

## M9 — Services Marketplace

### Purpose
Connect businesses with verified trade service providers (logistics, customs, legal, consulting) and earn commission on completed engagements.

### Responsibilities
- Service listing CRUD for verified providers
- Service search by category, state, price range
- Booking flow: request → confirm → pay → complete
- Commission processing: 7% to Market-Link, 93% to provider
- TIS contribution: +5 provider, +2 buyer per completed booking
- Booking status tracking

### 7 Service Categories
logistics-freight-forwarding, customs-clearance, trade-law, export-import-consulting, commodity-inspection, business-registration, trade-finance-advisory

### Database Tables
- `ServiceListing`
- `ServiceBooking`

### Deliverable Test
A service provider creates a listing → buyer searches and finds it → buyer creates a booking → provider confirms → payment is split 93/7 → both parties' TIS scores updated.

---

## M10 — Paystack Subscriptions

### Purpose
Monetisation engine. Processes subscription payments via Paystack and manages tier assignments.

### Responsibilities
- Create Paystack payment references for subscription initiation
- Process Paystack webhooks (source of truth for payment status)
- Verify webhook signatures before any processing
- Handle `charge.success` → update tier → assign badge → activate marketplace
- Handle `subscription.disable` → downgrade tier → notify user
- Handle `invoice.payment_failed` → email user → mark subscription at risk
- Split payments for services marketplace (93/7)

### Subscription Plans
| Plan | Tier | Amount (NGN) | Amount (Kobo) |
|---|---|---|---|
| Beta Seller | BETA_SELLER | ₦100,000 | 10,000,000 |
| Active Buyer | BETA_BUYER | ₦15,000 | 1,500,000 |
| Power Buyer | BETA_POWER_BUYER | ₦35,000 | 3,500,000 |

### Critical Rule
Never update user tier based on Paystack popup callback. Only the webhook with verified signature triggers tier changes.

### Database Tables
- `Subscription`
- `User` (tier, tierAssignedAt)

### Deliverable Test
User selects tier → Paystack popup opens → user pays → webhook fires → tier updated → badge assigned → marketplace activated → user sees new tier in dashboard.

---

## M11 — AI Matchmaker

### Purpose
AI-powered trade partner discovery. Uses AWS Bedrock (Claude) to analyse business profiles and recommend compatible trading partners.

### Responsibilities
- Weekly cron job generates top 10 matches per Beta user
- On-demand refresh (max 2/day per user)
- Build anonymised prompts (no PII sent to AI)
- Parse AI JSON responses and store matches in database
- Match expiry after 7 days
- Feedback loop: thumbs up/down influences future matching
- Quota tracking per billing cycle

### Anonymisation Rule
The following fields are NEVER included in AI prompts: business name, email, phone, NIN, BVN, bank account number. Only UUIDs, sector, state, business type, commodities, turnover range, years in operation, TIS score, and badge level are included.

### Database Tables
- `AiMatch`
- `AiQueryUsage`

### Deliverable Test
Weekly cron generates matches for a Beta user → user views matches with scores and reasoning → user sends introduction to a match → user gives thumbs down on another → next week's matches exclude the rejected match.

---

## M12–M15 — Supporting Modules

### M12 — AI Market Query
Natural language queries about commodity prices and market conditions. Answers are grounded in actual platform price data (no hallucination). Quota-gated to Beta+ users.

### M13 — AI Service Connector
NLP-based service provider matching. User describes their need in natural language → AI extracts intent and matches against verified providers. Falls back to TIS-sorted results if AI confidence is low.

### M14 — Trade Intelligence Score (TIS)
Composite score (0–100) reflecting platform trustworthiness. Components: verification completeness (30%), platform activity (30%), deal history (20%), response rate (10%), admin rating (10%). Displayed as badge level to other users (never as absolute number).

### M15 — Referral System
Every user gets a referral code. When a referred user becomes a paying subscriber, the referrer gets a 1-month discount. Tracked in `Referral` table.

---

*Market-Link · Backend Modules · WebCortex Technologies Limited · v1.0 · April 2026*
