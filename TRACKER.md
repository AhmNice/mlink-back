# Market-Link — Backend Sprint Tracker

> Living document. Update as each task is started and completed.
> Last updated: April 2, 2026

---

## Sprint Overview

| Sprint | Weeks | Dates | Phase | Theme | Status |
|---|---|---|---|---|---|
| **S1** | 1–2 | Apr 2 – Apr 15 | Phase 1 | DB Setup & Project Structure | 🔲 Not Started |
| **S2** | 3–4 | Apr 16 – Apr 29 | Phase 1 | Authentication & OTP | 🔲 Not Started |
| **S3** | 5–6 | Apr 30 – May 13 | Phase 1 | Profile & Document Upload | 🔲 Not Started |
| **S4** | 7–8 | May 14 – May 27 | Phase 2 | Admin Verification Queue | 🔲 Not Started |
| **S5** | 9–10 | May 28 – Jun 10 | Phase 2 | Admin Dashboard & User Mgmt | 🔲 Not Started |
| **S6** | 11–12 | Jun 11 – Jun 24 | Phase 3 | Market Pulse & Public Data | 🔲 Not Started |
| **S7** | 13–14 | Jun 25 – Jul 8 | Phase 3 | Free Tier Polish | 🔲 Not Started |
| **S8** | 15–16 | Jul 9 – Jul 22 | Phase 4 | Listing CRUD | 🔲 Not Started |
| **S9** | 17–18 | Jul 23 – Aug 5 | Phase 4 | Search & Inquiries | 🔲 Not Started |
| **S10** | 19–20 | Aug 6 – Aug 19 | Phase 5 | Core Messaging | 🔲 Not Started |
| **S11** | 21–22 | Aug 20 – Sep 2 | Phase 5 | Messaging Polish | 🔲 Not Started |
| **S12** | 23–24 | Sep 3 – Sep 16 | Phase 6 | Service Listings | 🔲 Not Started |
| **S13** | 25–26 | Sep 17 – Sep 30 | Phase 6 | Bookings & Commission | 🔲 Not Started |
| **S14** | 27–28 | Oct 1 – Oct 14 | Phase 7 | Paystack Integration | 🔲 Not Started |
| **S15** | 29–30 | Oct 15 – Oct 28 | Phase 8 | AI Matchmaker | 🔲 Not Started |
| **S16** | 31–32 | Oct 29 – Nov 25 | Phase 8 | AI Queries & Launch | 🔲 Not Started |

---

## Current Sprint: S1 — DB Setup & Project Structure

### Tasks

- [ ] BE-1.1 — Verify project structure matches PROJECT_STRUCTURE.md
- [ ] BE-1.2 — Configure environment variable validation
- [ ] BE-1.3 — Implement Prisma schema v1 (core models)
- [ ] BE-1.4 — Create seed script (commodities, states, categories, admin)
- [ ] BE-1.5 — Set up global error handler middleware
- [ ] BE-1.6 — Set up structured JSON logger
- [ ] BE-1.7 — Configure CORS for frontend origin
- [ ] BE-1.8 — Verify Prisma Studio works

### Sprint Goal
Development environment fully operational with database schema deployed and seed data populated.

### Sprint Deliverable
Backend server starts → connects to PostgreSQL → serves health check endpoint → Prisma Studio opens → seed data visible.

---

## Backlog (Next Sprints)

### S2 — Authentication & OTP
- [ ] BE-2.1 — POST /auth/register
- [ ] BE-2.2 — Email OTP via Nodemailer
- [ ] BE-2.3 — SMS OTP via Africa's Talking
- [ ] BE-2.4 — POST /auth/verify-otp
- [ ] BE-2.5 — OTP security rules (expiry, lockout, rate limit)
- [ ] BE-2.6 — POST /auth/login
- [ ] BE-2.7 — POST /auth/refresh
- [ ] BE-2.8 — JWT middleware
- [ ] BE-2.9 — GET /users/me/status
- [ ] BE-2.10 — Referral code tracking

### S3 — Profile & Document Upload
- [ ] BE-3.1 — POST /users/profile
- [ ] BE-3.2 — Profile Zod validation
- [ ] BE-3.3 — Local file upload endpoint
- [ ] BE-3.4 — PUT /users/documents/:id/confirm
- [ ] BE-3.5 — Readiness score calculation (S5)
- [ ] BE-3.6 — State transition S4 → S5 → PENDING_REVIEW
- [ ] BE-3.7 — Admin notification email
- [ ] BE-3.8 — File type and size validation

### S4 — Admin Verification Queue
- [ ] BE-4.1 — Admin authentication
- [ ] BE-4.2 — requireAdmin middleware
- [ ] BE-4.3 — GET /admin/queue
- [ ] BE-4.4 — GET /admin/users/:id
- [ ] BE-4.5 — POST /admin/queue/:id/approve
- [ ] BE-4.6 — Profile structuring logic
- [ ] BE-4.7 — POST /admin/queue/:id/reject
- [ ] BE-4.8 — POST /admin/queue/:id/request-docs
- [ ] BE-4.9 — Badge assignment logic
- [ ] BE-4.10 — Marketplace activation (S10)
- [ ] BE-4.11 — Free path (S7 → S9 → S10)

---

## Velocity Log

| Sprint | Planned | Completed | Carryover | Notes |
|---|---|---|---|---|
| S1 | — | — | — | — |
| S2 | — | — | — | — |
| S3 | — | — | — | — |

---

## Blockers

| Date | Blocker | Impact | Resolution | Status |
|---|---|---|---|---|
| — | — | — | — | — |

---

## Notes

- Update this file at the start and end of every sprint
- Mark tasks as `[x]` when complete, `[/]` when in progress
- Log any blockers immediately with date and impact assessment
- Record velocity (planned vs completed) for future sprint planning

---

*Market-Link · Backend Sprint Tracker · WebCortex Technologies Limited · April 2026*
