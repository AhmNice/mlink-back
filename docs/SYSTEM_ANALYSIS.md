# Market-Link — System Analysis & Requirements

> Shared reference document for both Backend and Frontend teams.
> WebCortex Technologies Limited · v1.0 · April 2026

---

## 1. Executive Summary

Market-Link is a verified B2B trade and investment intelligence platform targeting the Nigerian market. It addresses three critical problems in Nigerian B2B commerce: counterparty fraud (estimated $2B+ lost annually), commodity price opacity exploited by middlemen, and the absence of a trusted, verified B2B business directory.

The platform operates across three product tiers — Free, Beta, and Premium (post-MVP) — with a 10-step verification engine that establishes trust before any business can participate in the marketplace.

---

## 2. Problem Statement

| Problem | Impact | Scale |
|---|---|---|
| **Counterparty fraud** | Businesses cannot verify trading partners, leading to financial losses and eroded trust | $2B+ lost annually in Nigeria |
| **Price opacity** | Middlemen exploit information gaps in commodity pricing; buyers and sellers lack real-time market data | Affects all 20 MVP commodities across 10 states |
| **Fragmented discovery** | No centralised, verified B2B directory exists; businesses rely on personal networks and word of mouth | Millions of SMEs underserved |

---

## 3. System Objectives

### Primary Objectives
1. Build a 10-step verification engine that establishes provable trust for every business on the platform
2. Deliver a functional Free Tier marketplace that drives user acquisition and demonstrates platform value
3. Enable verified B2B listings with inquiry flows, search, and filtering for Beta tier subscribers
4. Provide encrypted secure messaging between verified businesses
5. Build a services marketplace connecting businesses with verified trade service providers
6. Integrate Paystack for subscription management and service commission processing
7. Deploy an AI-powered matchmaker that recommends compatible trading partners

### Secondary Objectives
1. Establish Market Pulse commodity price intelligence with tiered data access
2. Build an admin platform for verification queue management, listing moderation, and analytics
3. Design for future Premium tier features (Deal Room, Contract Facilitation, Escrow) without architectural rework

---

## 4. Target Users & Stakeholders

### User Personas

| Persona | Description | Tier | Primary Actions |
|---|---|---|---|
| **Unverified Visitor** | Registered but not yet through verification | None | Complete onboarding (S1–S10) |
| **Free Browser** | Verified but on free plan | Free | Browse directory, view lagged prices, download trade guides |
| **Active Buyer** | Beta subscriber looking to source commodities | Beta Buyer | Search listings, send inquiries, message sellers, view AI matches |
| **Power Buyer** | High-volume buyer with more AI quota | Beta Power Buyer | All buyer actions + higher AI query limits |
| **Verified Seller** | Beta subscriber listing commodities for sale | Beta Seller | Create/manage listings, receive inquiries, message buyers |
| **Service Provider** | Verified provider of trade services (logistics, legal, etc.) | Beta Seller | List services, receive bookings, earn via split payments |
| **Platform Admin** | WebCortex operations team member | Admin | Review verifications, moderate listings, manage prices, view analytics |

### Stakeholders

| Stakeholder | Interest |
|---|---|
| WebCortex Technologies Ltd | Platform owner, revenue from subscriptions and commissions |
| Nigerian SMEs | Primary users — buyers, sellers, service providers |
| Trade associations (NACCIMA, MAN) | Potential partnership and data sources |
| NCX / AFEX | Commodity exchange feeds for Market Pulse (post-MVP MOU) |
| Paystack | Payment processing partner |
| Africa's Talking | SMS OTP delivery partner |

---

## 5. Functional Requirements

### FR-1: Authentication & Identity
- FR-1.1: Users register with email, phone number, and password
- FR-1.2: OTP verification via email (Nodemailer) and SMS (Africa's Talking)
- FR-1.3: OTP is 6-digit numeric, cryptographically random, expires in 10 minutes
- FR-1.4: Maximum 3 OTP attempts per 15-minute window; lockout after 3 failures
- FR-1.5: OTP resend rate-limited to 1 per 60 seconds per phone number
- FR-1.6: JWT-based authentication with access and refresh token pair
- FR-1.7: Login via email + password returns JWT with user tier and verification status
- FR-1.8: Referral code generated per user at registration; optional referral tracking

### FR-2: 10-State Verification Pipeline
- FR-2.1: Every user progresses through exactly 10 states (S1–S10) sequentially
- FR-2.2: `verificationStatus` field is the single source of truth — no state can be skipped
- FR-2.3: State S3 (Profile Completion) collects business name, sector, state, LGA, business type, commodities, CAC number
- FR-2.4: State S4 (Document Submission) supports upload of CAC certificate, business ID, director's ID, TIN certificate, bank statement
- FR-2.5: State S5 (Readiness Score) auto-calculates from profile completeness (30%), document count (40%), and sector risk (30%)
- FR-2.6: State S6 (Admin Review) requires manual admin decision: approve, reject (with reason), or request more documents
- FR-2.7: State S7 (Profile Structuring) assigns match tags, sector classification, and tier eligibility
- FR-2.8: State S8 (Tier Assignment) handles both Free path (skip payment) and Beta path (Paystack)
- FR-2.9: State S9 (Badge Assignment) assigns badge level 1–3 based on tier and readiness score
- FR-2.10: State S10 (Marketplace Activation) makes user fully active — can browse, list, inquire, message

### FR-3: Admin Platform
- FR-3.1: Admin authentication with `isAdmin` flag on JWT
- FR-3.2: Verification queue showing paginated list of pending reviews with SLA flags (24-hour target)
- FR-3.3: Individual user review page with full profile details and document preview/download
- FR-3.4: Admin can approve (triggers S7), reject with mandatory reason (SES email), or request more documents
- FR-3.5: Listing moderation queue — approve or reject new listings
- FR-3.6: Market Pulse price data entry (manual admin fallback)
- FR-3.7: Analytics dashboard: verification funnel, MRR, AI usage, churn rate
- FR-3.8: All admin decisions logged in AdminAction table with timestamp

### FR-4: Free Tier Marketplace
- FR-4.1: Business directory with grid of verified business cards (name, sector, state, badge level, commodity tags)
- FR-4.2: Filters by state, sector, commodity, business type
- FR-4.3: Search with debounced input (300ms)
- FR-4.4: Contact details hidden — clicking "Contact" triggers upgrade prompt
- FR-4.5: Market Pulse shows commodity prices delayed by 7 days
- FR-4.6: Trade Knowledge Hub with downloadable PDF guides
- FR-4.7: Every gated feature shows upgrade prompt with specific feature name, Beta pricing, and CTA

### FR-5: Beta Verified Listings
- FR-5.1: Sellers create listings with: title, commodity type, description, quantity, price, delivery terms, location, photos (up to 5), validity (max 90 days)
- FR-5.2: Listings enter PENDING_REVIEW status; admin approves or rejects
- FR-5.3: Listing statuses: DRAFT → PENDING_REVIEW → LIVE → PAUSED / EXPIRED / REJECTED
- FR-5.4: Sellers limited to 5 active listings (Beta Seller tier)
- FR-5.5: Full-text search using PostgreSQL `tsvector` with GIN index
- FR-5.6: Filters: commodity, state, price range, delivery terms, sort by relevance/date/price

### FR-6: Buyer Search & Inquiry
- FR-6.1: Beta Buyers can send structured inquiries on listings
- FR-6.2: Inquiry contains: quantity of interest, unit, preferred delivery, message
- FR-6.3: Inquiry quota: 5/month for Active Buyer, unlimited for Power Buyer
- FR-6.4: Inquiry statuses: SENT → VIEWED → RESPONDED → DEAL_INITIATED → CLOSED
- FR-6.5: Seller receives email notification on new inquiry

### FR-7: Secure Messaging
- FR-7.1: Messages encrypted at rest (application-level encryption, KMS in production)
- FR-7.2: Thread ID deterministic: sorted concatenation of both user IDs
- FR-7.3: First 3 messages per thread monitored for off-platform contact sharing (phone, email, WhatsApp patterns)
- FR-7.4: Messages support text and file attachments (PDF, images, max 10MB)
- FR-7.5: Unread message count tracked per thread
- FR-7.6: Polling-based message updates (10-second interval); WebSocket post-MVP

### FR-8: Paystack Subscriptions
- FR-8.1: Three subscription plans: Beta Seller (₦100,000/mo), Active Buyer (₦15,000/mo), Power Buyer (₦35,000/mo)
- FR-8.2: Payment flow: Backend creates Paystack reference → Frontend opens popup → User pays → Webhook processes
- FR-8.3: Paystack webhook is the source of truth — never update tier from popup callback alone
- FR-8.4: Events handled: `charge.success`, `subscription.disable`, `invoice.payment_failed`
- FR-8.5: Free users skip payment — S7 → S9 → S10 directly

### FR-9: Market Pulse
- FR-9.1: Commodity price data for 20 commodities across 10 Nigerian states
- FR-9.2: Data sources: NCX feed, AFEX feed (post-MOU), platform transactions, manual admin entry
- FR-9.3: Free tier sees data delayed by 7 days; Beta tier sees current data
- FR-9.4: Price alerts: users set target price + direction (above/below); daily cron checks and emails
- FR-9.5: Admin data health check flags commodity/state pairs not updated in 48 hours

### FR-10: AI Matchmaker
- FR-10.1: Weekly cron generates top 10 matches per Beta user using AWS Bedrock (Claude)
- FR-10.2: On-demand refresh limited to 2 per user per day
- FR-10.3: Matches stored in database with compatibility score (0–100), reasoning, and 7-day expiry
- FR-10.4: Match feedback (thumbs up/down) influences future match quality
- FR-10.5: AI quota tracked per billing cycle: 5/month for Buyer/Seller, 10/month for Power Buyer
- FR-10.6: PII never included in AI prompts — anonymised profiles only

### FR-11: Services Marketplace
- FR-11.1: Seven service categories at launch: logistics, customs clearance, trade law, export consulting, commodity inspection, business registration, trade finance advisory
- FR-11.2: Service listing CRUD with category, description, coverage states, pricing structure, turnaround time
- FR-11.3: Service booking flow: request → confirm → pay → complete
- FR-11.4: Commission: 7% to Market-Link, 93% to provider (Paystack split payment)
- FR-11.5: TIS contribution: provider +5 points, buyer +2 points per completed booking

### FR-12: Referral System
- FR-12.1: Every user gets a unique referral code at registration
- FR-12.2: Referral tracked when new user registers with referral code
- FR-12.3: When referred user becomes a paying subscriber, referrer gets 1-month discount

---

## 6. Non-Functional Requirements

| ID | Category | Requirement | Target |
|---|---|---|---|
| NFR-1 | **Performance** | API response time under normal load | < 500ms for 95th percentile |
| NFR-2 | **Performance** | Page load time on mobile 4G | < 3 seconds (Largest Contentful Paint) |
| NFR-3 | **Scalability** | Concurrent users supported at launch | 100+ simultaneous |
| NFR-4 | **Security** | Authentication mechanism | JWT with refresh tokens, bcrypt password hashing |
| NFR-5 | **Security** | Data encryption | Messages encrypted at rest; PII fields encrypted with application-level encryption |
| NFR-6 | **Security** | Input validation | Zod schema validation on every endpoint |
| NFR-7 | **Availability** | Uptime target | 99.5% (post-launch) |
| NFR-8 | **Compliance** | NDPR (Nigeria Data Protection Regulation) | Consent at registration, right to deletion, purpose limitation |
| NFR-9 | **Accessibility** | WCAG 2.1 AA compliance | All interactive elements labelled, 4.5:1 contrast ratio, keyboard navigable |
| NFR-10 | **Compatibility** | Mobile browsers | Chrome Mobile, Safari iOS, Samsung Internet (latest 2 versions) |
| NFR-11 | **Compatibility** | Desktop browsers | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| NFR-12 | **Maintainability** | Code quality | ESLint + Prettier enforced, TypeScript strict mode |
| NFR-13 | **Internationalisation** | Currency | NGN (Nigerian Naira) primary; USD display post-MVP |
| NFR-14 | **Internationalisation** | Language | English only for MVP |

---

## 7. System Constraints

| Constraint | Description |
|---|---|
| **Team size** | 2 developers initially; documentation must support onboarding new developers at any point |
| **Budget** | Free-tier infrastructure only during development; paid services (Paystack, Africa's Talking) use test/sandbox credentials |
| **Local development** | No cloud infrastructure during development — local PostgreSQL, local file storage, SMTP email |
| **Third-party dependencies** | Africa's Talking (OTP SMS), Paystack (payments) — platform cannot launch without sandbox credentials for both |
| **Data sources** | Market Pulse data is manually entered by admin at MVP; NCX/AFEX API feeds require signed MOUs |
| **AI dependency** | AWS Bedrock access requires AWS account with model access approval — Phase 8 only |
| **Nigerian market specifics** | Phone numbers in +234 format, NGN currency, WAT timezone, NDPR compliance required |

---

## 8. The 10-State Verification Model

Every user passes through these states sequentially. The `verificationStatus` field on the User record is the single source of truth. No state can be skipped. The backend enforces state validity on every transition, and the frontend reads the state to determine what UI to render.

| State | Code | Trigger | Next State | Team |
|---|---|---|---|---|
| S1 | `PENDING_OTP` | User registers | S2 (on OTP verified) | BE + FE |
| S2 | `PENDING_PROFILE` | OTP verified, JWT issued | S3 (on profile submitted) | BE + FE |
| S3 | `PENDING_DOCUMENTS` | Profile form submitted | S4 (on first document uploaded) | BE + FE |
| S4 | `PENDING_SCORE` | Documents uploaded and confirmed | S5 (auto: score Lambda runs) | BE + FE |
| S5 | `PENDING_REVIEW` | Readiness score calculated | S6 (admin approves) or stays (more docs) | BE + FE (admin) |
| S6 | `REJECTED` | Admin rejects (with reason) | Can resubmit → back to S4 | BE + FE |
| S7 | `PENDING_PAYMENT` | Admin approves → profile structuring runs | S8 (Free path) or S8 (payment) | BE |
| S8 | `ACTIVE_FREE` or `ACTIVE_BETA` | Tier assigned (Free skips payment) | S9 (auto: badge assignment) | BE |
| S9 | `BADGE_ASSIGNED` | Badge level assigned (1/2/3) | S10 (auto: activation) | BE |
| S10 | `MARKETPLACE_ACTIVE` | Full marketplace access granted | — (terminal active state) | BE + FE |

### State Transition Rules
- Only one active state at a time
- No backward transitions (except REJECTED → resubmit → S4)
- Every transition logged in `AdminAction` table with timestamp
- Free users skip payment step — S7 → S9 → S10 with badge level 1

---

## 9. Tier System & Access Control

| Tier | Monthly Cost | Listing Limit | Inquiry Limit | AI Queries | Messaging | Market Pulse |
|---|---|---|---|---|---|---|
| **Free** | ₦0 | 0 | 0 | 0 | No | 7-day delayed |
| **Beta Buyer** | ₦15,000 | 0 | 5/month | 5/month | Yes | Live |
| **Beta Power Buyer** | ₦35,000 | 0 | Unlimited | 10/month | Yes | Live |
| **Beta Seller** | ₦100,000 | 5 | Unlimited (receiving) | 5/month | Yes | Live |
| **Premium** | ₦300,000 | Unlimited | Unlimited | Unlimited | Yes + Deal Room | Live + Alerts |

> Premium tier is documented for architectural awareness but is **not in MVP scope**.

---

## 10. Use Cases

### UC-1: New Business Registration & Verification
**Actor:** Business Owner
**Flow:** Register with email/phone → Verify OTP → Complete business profile → Upload verification documents → Wait for admin review → Receive approval/rejection → Access marketplace

### UC-2: Free Tier Market Browsing
**Actor:** Free User
**Flow:** Browse business directory → View business cards (no contact details) → View lagged commodity prices → Download trade guides → Encounter upgrade prompts on gated features

### UC-3: Seller Lists a Commodity
**Actor:** Beta Seller
**Flow:** Create listing with commodity details + photos → Submit for admin review → Receive approval notification → Listing appears in buyer search results → Receive inquiries from buyers

### UC-4: Buyer Searches and Inquires
**Actor:** Beta Buyer
**Flow:** Search listings by commodity/state/price → View listing details → Send structured inquiry (within monthly quota) → Seller receives notification → Begin messaging thread

### UC-5: Secure Business Messaging
**Actor:** Two verified Beta users
**Flow:** Inquiry or match triggers thread creation → Exchange encrypted messages → System monitors first 3 messages for off-platform contact sharing → Continue negotiation on-platform

### UC-6: Admin Reviews Verification
**Actor:** Platform Admin
**Flow:** View verification queue (sorted by submission date) → Open individual review → Preview uploaded documents → Make decision (approve/reject/request more) → Decision logged and user notified

### UC-7: AI Match Discovery
**Actor:** Beta User
**Flow:** View weekly AI-generated matches → Review compatibility scores and reasoning → Send introduction to interesting match → Provide thumbs up/down feedback → Matches improve over time

### UC-8: Service Booking
**Actor:** Beta Buyer + Service Provider
**Flow:** Buyer searches for trade service → Selects provider → Creates booking request → Provider confirms → Buyer pays via Paystack (93/7 split) → Service completed → TIS updated for both parties

---

## 11. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Africa's Talking SMS delivery failures in certain regions | Medium | High | Dual OTP: email always available as fallback; SMS as enhancement |
| Paystack integration delays (KYC requirements for business account) | Medium | High | Start Paystack business verification in Phase 1; use test keys until Phase 7 |
| AWS Bedrock model access approval delay | Low | Medium | AI features are Phase 8; if delayed, launch without AI and add post-launch |
| Small team size causing sprint overruns | High | Medium | Each sprint has a clear cut line — must-have vs stretch goals; features prioritised by dependency chain |
| PostgreSQL performance on full-text search at scale | Low | Medium | GIN indexes on tsvector columns; pagination enforced; consider Elasticsearch post-MVP |
| NCX/AFEX MOU not signed by launch | High | Low | Manual admin price entry is the MVP fallback — no launch dependency on exchange feeds |

---

## 12. NDPR Compliance

The Nigeria Data Protection Regulation (NDPR) applies to Market-Link as it processes Nigerian citizens' personal data.

| Requirement | Implementation |
|---|---|
| **Consent at registration** | Explicit checkbox + timestamp stored on User record |
| **Purpose limitation** | PII collected only as defined in the profile schema; never shared with third parties without consent |
| **Data minimisation** | Only business-relevant fields collected; personal IDs (NIN, BVN) encrypted and used only for verification |
| **Data access request** | Admin can export user data on request (built post-MVP, manual export for MVP) |
| **Right to deletion** | Account suspension → data purge within 30 days; cascade delete on all related records |
| **Data protection** | PII fields encrypted; messages encrypted at rest; no PII in logs; no PII sent to AI services |
| **Breach notification** | Admin notified immediately via email if suspicious access patterns detected |

---

## 13. Assumptions & Dependencies

### Assumptions
1. The primary user base accesses the platform via mobile devices (mobile-first design)
2. All users have a Nigerian phone number for OTP verification
3. Internet connectivity is available but may be slow (optimise for 3G/4G performance)
4. English is the primary language for all platform content
5. NGN is the primary currency for all transactions
6. Admin operations are performed on desktop browsers

### Dependencies
| Dependency | Required By | Status |
|---|---|---|
| PostgreSQL 15+ | Sprint 1 | Local installation required |
| Node.js 20 LTS | Sprint 1 | Development prerequisite |
| Africa's Talking sandbox | Sprint 2 | Account creation needed |
| Paystack test keys | Sprint 14 | Business account verification needed |
| AWS account (Bedrock) | Sprint 15 | Model access request needed |
| Domain (marketlink.ng) | Production | Domain registration needed |

---

*Market-Link · System Analysis · WebCortex Technologies Limited · v1.0 · April 2026*
