# Market-Link — Backend Project Structure

> Directory tree with descriptions of every folder and key file.
> WebCortex Technologies Limited · v1.0 · April 2026

---

## Root Directory

```
mlink-back/
│
├── prisma/                          # Database schema and migrations
│   ├── schema.prisma                # Prisma schema definition (single source of truth for DB)
│   ├── seed.ts                      # Seed script: commodities, states, categories, admin user
│   └── migrations/                  # Auto-generated migration files (committed to Git)
│       └── YYYYMMDDHHMMSS_name/     # Each migration is a timestamped folder
│           └── migration.sql        # Raw SQL executed for this migration
│
├── src/                             # All application source code
│   ├── app.ts                       # Express app configuration (middleware, routes, CORS)
│   ├── server.ts                    # HTTP server entry point (listen on PORT)
│   │
│   ├── config/                      # Configuration and constants
│   │   ├── env.ts                   # Environment variable validation and export
│   │   ├── constants.ts             # Commodities list, states list, sectors, service categories
│   │   └── cors.ts                  # CORS configuration for allowed origins
│   │
│   ├── routes/                      # Express route definitions (maps URLs to controllers)
│   │   ├── index.ts                 # Root router — mounts all sub-routers under /api/v1
│   │   ├── auth.routes.ts           # /api/v1/auth/* routes
│   │   ├── user.routes.ts           # /api/v1/users/* routes
│   │   ├── listing.routes.ts        # /api/v1/listings/* routes
│   │   ├── inquiry.routes.ts        # /api/v1/inquiries/* routes
│   │   ├── message.routes.ts        # /api/v1/messages/* routes
│   │   ├── market-pulse.routes.ts   # /api/v1/market-pulse/* routes
│   │   ├── service.routes.ts        # /api/v1/services/* routes
│   │   ├── ai.routes.ts             # /api/v1/ai/* routes
│   │   ├── payment.routes.ts        # /api/v1/payments/* routes
│   │   └── admin.routes.ts          # /api/v1/admin/* routes
│   │
│   ├── controllers/                 # Request handlers (thin layer: validate → call service → respond)
│   │   ├── auth.controller.ts       # Register, verify-otp, login, refresh, logout
│   │   ├── user.controller.ts       # Profile, documents, status
│   │   ├── listing.controller.ts    # CRUD, search
│   │   ├── inquiry.controller.ts    # Create, list, update status
│   │   ├── message.controller.ts    # Send, get thread, list threads
│   │   ├── market-pulse.controller.ts # Prices, history, alerts
│   │   ├── service.controller.ts    # Service CRUD, search, bookings
│   │   ├── ai.controller.ts         # Matches, queries, service connector
│   │   ├── payment.controller.ts    # Subscription, webhook
│   │   └── admin.controller.ts      # Queue, users, listings, analytics
│   │
│   ├── services/                    # Business logic (all domain logic lives here)
│   │   ├── auth.service.ts          # Registration, OTP generation/validation, JWT issuance
│   │   ├── user.service.ts          # Profile management, document handling, status queries
│   │   ├── verification.service.ts  # State machine: transitions, readiness score, badge assignment
│   │   ├── listing.service.ts       # Listing CRUD, search, listing limits
│   │   ├── inquiry.service.ts       # Inquiry creation, quota tracking, status updates
│   │   ├── message.service.ts       # Message encryption/decryption, thread management
│   │   ├── market-pulse.service.ts  # Price queries, data lag logic, alerts
│   │   ├── service.service.ts       # Service listings, bookings, commission calculation
│   │   ├── ai.service.ts            # Match generation, query handling, quota enforcement
│   │   ├── payment.service.ts       # Paystack integration, webhook processing, tier updates
│   │   └── admin.service.ts         # Queue management, analytics, moderation
│   │
│   ├── middlewares/                 # Express middleware functions
│   │   ├── auth.middleware.ts       # JWT validation — attaches user to request
│   │   ├── admin.middleware.ts      # Requires isAdmin: true on JWT user
│   │   ├── tier.middleware.ts       # Tier gate — checks if user's tier is in allowed list
│   │   ├── verification.middleware.ts # Requires MARKETPLACE_ACTIVE status
│   │   ├── validate.middleware.ts   # Zod schema validation for request bodies
│   │   ├── rate-limit.middleware.ts # IP-based rate limiting
│   │   └── error.middleware.ts      # Global error handler — formats all errors to standard envelope
│   │
│   ├── validations/                 # Zod schemas for request validation
│   │   ├── auth.validation.ts       # Register, login, OTP schemas
│   │   ├── user.validation.ts       # Profile, document upload schemas
│   │   ├── listing.validation.ts    # Listing create/update schemas
│   │   ├── inquiry.validation.ts    # Inquiry create schema
│   │   ├── message.validation.ts    # Message send schema
│   │   └── service.validation.ts    # Service listing, booking schemas
│   │
│   ├── utils/                       # Shared utility functions
│   │   ├── api-response.ts          # successResponse(), errorResponse(), ApiError class
│   │   ├── Session.ts                   # signToken(), verifyToken() helpers
│   │   ├── otp.ts                   # generateOtp(), validateOtp() helpers
│   │   ├── email.ts                 # Nodemailer transporter and send helpers
│   │   ├── sms.ts                   # Africa's Talking SMS send helper
│   │   ├── encryption.ts           # Encrypt/decrypt helpers for PII and messages
│   │   ├── file-upload.ts          # Local file storage helpers (dev), S3 helpers (production)
│   │   ├── logger.ts               # Structured JSON logger (no raw stack traces)
│   │   └── thread-id.ts            # Deterministic thread ID generation
│   │
│   ├── interfaces/                  # TypeScript type definitions
│   │   ├── auth.interface.ts        # JWT payload, login request/response types
│   │   ├── user.interface.ts        # User, profile, document types
│   │   ├── listing.interface.ts     # Listing, search params types
│   │   ├── api.interface.ts         # ApiResponse, ApiError, PaginationMeta types
│   │   └── index.ts                 # Re-exports all interfaces
│   │
│   ├── generated/                   # Auto-generated files (do NOT edit manually)
│   │   └── prisma/                  # Prisma client (generated by `prisma generate`)
│   │
│   └── prompts/                     # AI prompt templates (Phase 8)
│       ├── ai-matchmaker.ts         # Match generation prompt builder
│       ├── ai-service-connector.ts  # Service intent extraction prompt
│       └── market-pulse-query.ts    # Market intelligence Q&A prompt
│
├── uploads/                         # Local file storage (development only, gitignored)
│   ├── kyc/                         # User verification documents
│   │   └── {userId}/               # Per-user document storage
│   ├── listings/                    # Listing photos
│   │   └── {listingId}/            # Per-listing photo storage
│   └── messages/                    # Message attachments
│       └── {threadId}/             # Per-thread attachment storage
│
├── tests/                           # Test files (mirrors src/ structure)
│   ├── unit/                        # Unit tests for individual functions
│   │   ├── services/
│   │   ├── utils/
│   │   └── validations/
│   └── integration/                 # Integration tests (full request/response)
│       ├── auth.test.ts
│       ├── verification.test.ts
│       ├── listings.test.ts
│       └── payments.test.ts
│
├── scripts/                         # Utility scripts
│   └── create-admin.ts             # Script to create an admin user
│
├── .env                             # Local environment variables (gitignored)
├── .env.example                     # Template for environment variables
├── .gitignore                       # Git ignore rules
├── .prettierrc                      # Prettier configuration
├── .prettierignore                  # Files excluded from Prettier
├── eslint.config.js                 # ESLint configuration
├── tsconfig.json                    # TypeScript compiler configuration
├── prisma.config.ts                 # Prisma configuration (output directory override)
├── package.json                     # Dependencies and scripts
├── package-lock.json                # Dependency lock file
├── README.md                        # Project overview and setup guide
├── TRACKER.md                       # Living sprint progress tracker
│
└── docs/                            # Technical documentation
    ├── SYSTEM_ANALYSIS.md           # Requirements, constraints, use cases
    ├── DATABASE_DESIGN.md           # Schema, entities, relationships
    ├── API_CONTRACT.md              # Complete endpoint specification
    ├── MODULES.md                   # Backend module breakdown
    ├── PROJECT_STRUCTURE.md         # This file
    └── IMPLEMENTATION_ROADMAP.md    # Phase/sprint development plan
```

---

## Key Architectural Patterns

### Controller → Service → Database

Every request follows a three-layer pattern:
1. **Controller** — Validates request, extracts parameters, calls service, formats response
2. **Service** — Contains all business logic, database queries, external API calls
3. **Database** — Prisma client handles all database operations

Controllers never access the database directly. Services never format HTTP responses. This separation makes it straightforward to migrate from Express to Lambda in production — only the controller layer changes.

### Middleware Chain

Every request passes through middleware in this order:
1. CORS
2. Body parsing (JSON)
3. Rate limiting
4. JWT authentication (for protected routes)
5. Tier gate (for tier-restricted routes)
6. Verification status check (for marketplace routes)
7. Zod validation (for routes with request bodies)
8. Controller handler
9. Error handler (catches all errors, formats to standard envelope)

### File Naming Convention

| Type | Convention | Example |
|---|---|---|
| Routes | `{domain}.routes.ts` | `auth.routes.ts` |
| Controllers | `{domain}.controller.ts` | `auth.controller.ts` |
| Services | `{domain}.service.ts` | `auth.service.ts` |
| Middleware | `{name}.middleware.ts` | `auth.middleware.ts` |
| Validations | `{domain}.validation.ts` | `auth.validation.ts` |
| Interfaces | `{domain}.interface.ts` | `auth.interface.ts` |
| Utils | `{name}.ts` | `jwt.ts` |

### Adding a New Feature

1. Define the Zod validation schema in `validations/`
2. Create or extend the service in `services/`
3. Create or extend the controller in `controllers/`
4. Define the route in `routes/`
5. Mount the router in `routes/index.ts`
6. Write tests in `tests/`

---

*Market-Link · Project Structure · WebCortex Technologies Limited · v1.0 · April 2026*
