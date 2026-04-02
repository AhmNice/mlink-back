# Market-Link — Database Design

> Complete database schema specification with Prisma definitions.
> WebCortex Technologies Limited · v1.0 · April 2026

---

## 1. Design Philosophy

- **PostgreSQL** is the sole data store for the MVP — no Redis, no DynamoDB, no secondary databases
- **Prisma ORM** manages schema definition, migrations, and type-safe queries
- **UUIDs** as primary keys across all tables — no auto-incrementing integers (avoids enumeration attacks)
- **Soft deletes** where applicable — critical business data is never physically removed
- **Denormalised counters** on Listing (viewCount, inquiryCount) for read performance
- **Encrypted fields** for PII (NIN, BVN, bank account) — stored as encrypted strings, decrypted only in the API layer
- **Nullable fields** for future Premium tier extensions — schema must not block future features

---

## 2. Entity Relationship Overview

```
User (1) ──── (1) UserProfile
  │
  ├── (1:N) UserDocument
  ├── (1:N) Listing ──── (1:N) Inquiry
  ├── (1:N) Inquiry (as buyer)
  ├── (1:N) Inquiry (as seller)
  ├── (1:N) Message (as sender)
  ├── (1:N) Message (as recipient)
  ├── (1:N) AiMatch
  ├── (1:N) AiQueryUsage
  ├── (1:N) Subscription
  ├── (1:N) PriceAlert
  ├── (1:N) ServiceListing
  ├── (1:N) ServiceBooking (as buyer)
  ├── (1:N) AdminAction (as admin)
  ├── (1:N) AdminAction (as target)
  ├── (1:N) Dispute
  └── (1:N) RefreshToken

Inquiry (N:1) ──── Listing
Inquiry (1:N) ──── Message

ServiceListing (1:N) ──── ServiceBooking

CommodityPrice (standalone — no FK to User)
Referral (standalone — tracks referral codes)
```

---

## 3. Enumerations

```prisma
enum VerificationStatus {
  PENDING_OTP           // S1: Account created, OTP not yet verified
  PENDING_PROFILE       // S2: OTP verified, profile not yet completed
  PENDING_DOCUMENTS     // S3: Profile completed, documents not yet uploaded
  PENDING_SCORE         // S4: Documents uploaded, readiness score not yet calculated
  PENDING_REVIEW        // S5: Readiness score calculated, awaiting admin review
  REJECTED              // S6: Admin rejected — user can resubmit documents
  PENDING_STRUCTURING   // S6→S7: Admin approved, profile structuring in progress
  PENDING_PAYMENT       // S7: Profile structured, awaiting payment (Beta path)
  BADGE_ASSIGNED        // S9: Badge assigned, activation pending
  MARKETPLACE_ACTIVE    // S10: Fully active — can use marketplace
  SUSPENDED             // Admin-suspended account
}

enum UserTier {
  FREE                  // No payment — limited access
  BETA_BUYER            // ₦15,000/month — 5 inquiries, 5 AI queries
  BETA_POWER_BUYER      // ₦35,000/month — unlimited inquiries, 10 AI queries
  BETA_SELLER           // ₦100,000/month — 5 listings, messaging, AI
  PREMIUM               // Post-MVP: ₦300,000/month
  ADMIN                 // Platform administrators
}

enum ListingStatus {
  DRAFT                 // Created but not submitted
  PENDING_REVIEW        // Submitted, awaiting admin approval
  LIVE                  // Approved and visible in search
  PAUSED                // Seller temporarily paused
  EXPIRED               // Past validUntil date
  REJECTED              // Admin rejected with reason
}

enum InquiryStatus {
  SENT                  // Buyer sent inquiry
  VIEWED                // Seller viewed the inquiry
  RESPONDED             // Seller responded
  DEAL_INITIATED        // Both parties agreed to proceed
  CLOSED                // Inquiry closed (resolved or abandoned)
}

enum DocumentType {
  CAC_CERTIFICATE       // Corporate Affairs Commission registration
  BUSINESS_ID           // Company-issued identification
  DIRECTORS_ID          // Director's personal identification
  TIN_CERTIFICATE       // Tax Identification Number certificate
  BANK_STATEMENT        // Company bank statement
  OTHER                 // Any other supporting document
}

enum DisputeType {
  FRAUD_CLAIM
  NON_DELIVERY
  PAYMENT_DISPUTE
  IMPERSONATION
  LISTING_MISREPRESENTATION
}

enum DisputeStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED
  CLOSED
}

enum PriceSource {
  NCX_FEED              // Nigerian Commodity Exchange
  AFEX_FEED             // AFEX Commodities Exchange
  PLATFORM_TRANSACTION  // Anonymised from confirmed bookings
  MANUAL_ADMIN          // Manually entered by admin (MVP fallback)
}
```

---

## 4. Core Models

### 4.1 User

The central entity. Every person on the platform is a User. The `verificationStatus` field drives the entire onboarding flow and determines what features are accessible.

```prisma
model User {
  id                  String             @id @default(uuid())
  email               String             @unique
  phoneNumber         String             @unique
  passwordHash        String
  verificationStatus  VerificationStatus @default(PENDING_OTP)
  tier                UserTier           @default(FREE)
  tierAssignedAt      DateTime?
  badgeLevel          Int                @default(0)  // 0=none, 1=basic, 2=verified, 3=premium
  otpCode             String?
  otpExpiresAt        DateTime?
  otpAttempts         Int                @default(0)
  otpLastSentAt       DateTime?
  readinessScore      Int                @default(0)
  tisScore            Int                @default(0)
  isAdmin             Boolean            @default(false)
  isSuspended         Boolean            @default(false)
  suspendedAt         DateTime?
  suspendedReason     String?
  referralCode        String             @unique @default(uuid())
  referredByCode      String?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  // Relations
  profile             UserProfile?
  documents           UserDocument[]
  listings            Listing[]
  sentMessages        Message[]          @relation("SentMessages")
  receivedMessages    Message[]          @relation("ReceivedMessages")
  sentInquiries       Inquiry[]          @relation("SentInquiries")
  receivedInquiries   Inquiry[]          @relation("ReceivedInquiries")
  aiMatches           AiMatch[]
  aiQueryUsage        AiQueryUsage[]
  subscriptions       Subscription[]
  priceAlerts         PriceAlert[]
  serviceListings     ServiceListing[]
  serviceBookings     ServiceBooking[]
  adminActions        AdminAction[]      @relation("AdminActions")
  actionedByAdmin     AdminAction[]      @relation("ActionedByAdmin")
  disputes            Dispute[]
  refreshTokens       RefreshToken[]

  @@index([verificationStatus])
  @@index([tier])
  @@index([tierAssignedAt])
  @@index([email])
}
```

**Key Design Decisions:**
- `otpCode` is stored temporarily and cleared after verification or expiry
- `otpAttempts` resets after successful verification or after the 15-minute lockout window
- `badgeLevel` 0 means no badge (unverified); levels 1–3 indicate increasing trust
- `tisScore` (Trade Intelligence Score) is a composite score 0–100, recalculated periodically
- `referralCode` is auto-generated UUID — used in referral links

### 4.2 UserProfile

One-to-one relationship with User. Contains all business-specific information collected during onboarding (State S3).

```prisma
model UserProfile {
  id                  String    @id @default(uuid())
  userId              String    @unique
  businessName        String
  sector              String
  state               String
  lga                 String?
  businessDescription String    @db.Text
  businessType        String    // "buyer" | "seller" | "service_provider" | "mixed"
  yearsInOperation    Int?
  annualTurnoverRange String?   // e.g., "10M-50M NGN"
  commodities         String[]  // Array of commodity slugs from the 20 MVP list
  employeeCount       String?
  website             String?
  cacNumber           String?
  tinNumber           String?

  // Encrypted PII fields — stored as encrypted strings
  ninEncrypted        String?
  bvnEncrypted        String?
  bankAccountEncrypted String?

  // Match metadata — set by admin during S7 (Profile Structuring)
  matchTags           String[]
  sectorClassification String?
  tierEligibility     String[]  // Which tiers this user qualifies for

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  user                User      @relation(fields: [userId], references: [id])

  @@index([sector])
  @@index([state])
  @@index([businessType])
}
```

### 4.3 UserDocument

Documents uploaded during State S4. Each document is stored as a file (local in dev, S3 in production) and referenced by its storage key.

```prisma
model UserDocument {
  id          String       @id @default(uuid())
  userId      String
  type        DocumentType
  s3Key       String       // File path (local) or S3 key (production)
  s3Bucket    String       // Bucket name or "local"
  fileName    String
  fileSize    Int          // Bytes
  mimeType    String       // "application/pdf", "image/jpeg", etc.
  uploadedAt  DateTime     @default(now())
  reviewedAt  DateTime?
  reviewedBy  String?      // Admin user ID who reviewed

  user        User         @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

### 4.4 RefreshToken

Stores JWT refresh tokens for token rotation. Old tokens are revoked on each refresh.

```prisma
model RefreshToken {
  id        String    @id @default(uuid())
  token     String    @unique
  userId    String
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}
```

---

## 5. Listing & Inquiry Models

### 5.1 Listing

Created by Beta Sellers. Represents a commodity available for sale.

```prisma
model Listing {
  id                String        @id @default(uuid())
  sellerId          String
  title             String
  commodityType     String        // From the 20 MVP commodities list
  category          String
  description       String        @db.Text
  quantityAvailable Decimal
  quantityUnit      String        // "kg", "tonne", "bags", "pieces", "litres"
  pricePerUnit      Decimal?
  currency          String        @default("NGN")
  priceOnRequest    Boolean       @default(false)
  minimumOrder      Decimal?
  deliveryTerms     String        // "ex-works", "fob", "cif", "ddp", "negotiable"
  qualityGrade      String?
  certifications    String[]
  locationState     String        // From the 10 launch states
  locationLga       String?
  validUntil        DateTime
  status            ListingStatus @default(DRAFT)
  photoS3Keys       String[]      // Array of file paths or S3 keys (max 5)
  viewCount         Int           @default(0)
  inquiryCount      Int           @default(0)
  matchCount        Int           @default(0)
  approvedBy        String?       // Admin user ID
  approvedAt        DateTime?
  rejectedReason    String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  seller            User          @relation(fields: [sellerId], references: [id])
  inquiries         Inquiry[]

  @@index([status])
  @@index([commodityType])
  @@index([locationState])
  @@index([sellerId])
  @@index([validUntil])
}
```

**Note on Full-Text Search:** A `search_vector` column of type `tsvector` will be added via a raw SQL migration (not representable in Prisma schema). A GIN index and update trigger will be created alongside it. See Migration Strategy section.

### 5.2 Inquiry

A structured expression of interest from a buyer to a seller regarding a specific listing.

```prisma
model Inquiry {
  id                 String        @id @default(uuid())
  buyerId            String
  sellerId           String
  listingId          String?
  quantityOfInterest Decimal?
  quantityUnit       String?
  preferredDelivery  String?
  messageContent     String        @db.Text
  status             InquiryStatus @default(SENT)
  viewedAt           DateTime?
  respondedAt        DateTime?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  buyer              User          @relation("SentInquiries", fields: [buyerId], references: [id])
  seller             User          @relation("ReceivedInquiries", fields: [sellerId], references: [id])
  listing            Listing?      @relation(fields: [listingId], references: [id])
  messages           Message[]

  @@index([buyerId])
  @@index([sellerId])
  @@index([status])
}
```

---

## 6. Messaging Model

### 6.1 Message

Messages are encrypted at rest. The `contentEncrypted` field stores cipher text — decryption happens exclusively in the API layer.

```prisma
model Message {
  id                String    @id @default(uuid())
  threadId          String    // Deterministic: sorted(userId1, userId2) joined with "-"
  inquiryId         String?   // Optional link to originating inquiry
  senderId          String
  recipientId       String
  contentEncrypted  String    @db.Text  // Encrypted message body
  attachmentS3Keys  String[]
  readAt            DateTime?
  createdAt         DateTime  @default(now())

  sender            User      @relation("SentMessages", fields: [senderId], references: [id])
  recipient         User      @relation("ReceivedMessages", fields: [recipientId], references: [id])
  inquiry           Inquiry?  @relation(fields: [inquiryId], references: [id])

  @@index([threadId])
  @@index([senderId])
  @@index([recipientId])
  @@index([createdAt])
}
```

**Thread ID Construction:** The `threadId` is computed as `sorted([userId1, userId2]).join('-')`. This ensures the same thread ID regardless of who initiates the conversation, and enables efficient querying of all messages between two users.

---

## 7. AI Feature Models

### 7.1 AiMatch

Stores AI-generated match recommendations. Each match has a compatibility score, reasoning, and a 7-day expiry.

```prisma
model AiMatch {
  id                 String    @id @default(uuid())
  userId             String
  matchedUserId      String
  compatibilityScore Int       // 0–100
  reasoning          String    @db.Text
  matchTags          String[]
  isEngaged          Boolean   @default(false)  // User sent an introduction
  engagedAt          DateTime?
  thumbsUp           Boolean?  // null = no feedback, true = positive, false = negative
  generatedAt        DateTime  @default(now())
  expiresAt          DateTime  // 7 days from generation

  user               User      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([generatedAt])
  @@index([expiresAt])
}
```

### 7.2 AiQueryUsage

Tracks AI query consumption per user per billing cycle. Prevents over-usage through quota enforcement.

```prisma
model AiQueryUsage {
  id           String    @id @default(uuid())
  userId       String
  queryType    String    // "match_refresh" | "market_query" | "service_connector"
  billingCycle String    // Format: "2026-04" (year-month)
  queryCount   Int       @default(0)
  updatedAt    DateTime  @updatedAt

  user         User      @relation(fields: [userId], references: [id])

  @@unique([userId, queryType, billingCycle])
  @@index([userId])
  @@index([billingCycle])
}
```

---

## 8. Market Pulse Models

### 8.1 CommodityPrice

Standalone table — not linked to any user. Stores commodity price data points from various sources.

```prisma
model CommodityPrice {
  id            String      @id @default(uuid())
  commodity     String      // From the 20 MVP commodities list
  state         String      // From the 10 launch states
  pricePerUnit  Decimal
  unit          String      // "tonne", "kg", "bag", etc.
  currency      String      @default("NGN")
  source        PriceSource
  sourceRef     String?     // External reference ID from NCX/AFEX
  recordedAt    DateTime    // When the price was observed
  publishedAt   DateTime    @default(now())  // When it was entered into the system
  publishedBy   String?     // Admin user ID (for MANUAL_ADMIN entries)

  @@index([commodity, state])
  @@index([recordedAt])
  @@index([publishedAt])
}
```

### 8.2 PriceAlert

User-defined alerts that trigger email notifications when a commodity price crosses a threshold.

```prisma
model PriceAlert {
  id          String    @id @default(uuid())
  userId      String
  commodity   String
  state       String
  targetPrice Decimal
  direction   String    // "above" | "below"
  isActive    Boolean   @default(true)
  triggeredAt DateTime?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([commodity, state, isActive])
}
```

---

## 9. Payments & Subscriptions

### 9.1 Subscription

Tracks active and historical subscriptions. Linked to Paystack subscription codes.

```prisma
model Subscription {
  id                       String    @id @default(uuid())
  userId                   String
  tier                     UserTier
  paystackSubscriptionCode String?
  paystackCustomerCode     String?
  amount                   Int       // In kobo (₦15,000 = 1500000 kobo)
  currency                 String    @default("NGN")
  status                   String    // "active" | "cancelled" | "expired"
  currentPeriodStart       DateTime
  currentPeriodEnd         DateTime
  cancelledAt              DateTime?
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt

  user                     User      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
  @@index([currentPeriodEnd])
}
```

---

## 10. Services Marketplace

### 10.1 ServiceListing

Created by verified service providers (logistics, legal, consulting, etc.).

```prisma
model ServiceListing {
  id                  String        @id @default(uuid())
  providerId          String
  title               String
  category            String        // From 7 MVP service categories
  description         String        @db.Text
  coverageStates      String[]      // States this provider operates in
  pricingStructure    String        // "fixed" | "hourly" | "project_based"
  basePrice           Decimal?
  currency            String        @default("NGN")
  priceOnRequest      Boolean       @default(false)
  minimumEngagement   String?       // e.g., "1 month", "1 shipment"
  turnaroundTime      String?       // e.g., "3-5 business days"
  credentials         String[]      // Professional certifications
  status              ListingStatus @default(DRAFT)
  approvedAt          DateTime?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  provider            User          @relation(fields: [providerId], references: [id])
  bookings            ServiceBooking[]

  @@index([category])
  @@index([providerId])
  @@index([status])
}
```

### 10.2 ServiceBooking

Represents a confirmed engagement between a buyer and a service provider.

```prisma
model ServiceBooking {
  id                    String    @id @default(uuid())
  serviceListingId      String
  buyerId               String
  providerId            String
  agreedAmount          Int       // In kobo
  currency              String    @default("NGN")
  paystackReference     String?
  platformCommission    Int       // 7% of agreedAmount, in kobo
  providerPayout        Int       // 93% of agreedAmount, in kobo
  status                String    // "pending" | "confirmed" | "completed" | "disputed" | "refunded"
  confirmedAt           DateTime?
  completedAt           DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  serviceListing        ServiceListing @relation(fields: [serviceListingId], references: [id])
  buyer                 User           @relation(fields: [buyerId], references: [id])
}
```

---

## 11. Admin & Governance

### 11.1 AdminAction

Immutable audit log for all administrative decisions. Every admin action is recorded here for accountability and compliance.

```prisma
model AdminAction {
  id           String    @id @default(uuid())
  adminId      String
  targetUserId String?
  actionType   String    // "approve", "reject", "suspend", "tier_change", "listing_approve", etc.
  reason       String?
  metadata     Json?     // Flexible field for action-specific data
  createdAt    DateTime  @default(now())

  admin        User      @relation("ActionedByAdmin", fields: [adminId], references: [id])
  targetUser   User?     @relation("AdminActions", fields: [targetUserId], references: [id])

  @@index([adminId])
  @@index([targetUserId])
  @@index([createdAt])
}
```

### 11.2 Dispute

Tracks disputes raised by users against other users or listings.

```prisma
model Dispute {
  id             String        @id @default(uuid())
  raisedById     String
  againstUserId  String?
  listingId      String?
  type           DisputeType
  description    String        @db.Text
  status         DisputeStatus @default(OPEN)
  resolvedBy     String?       // Admin user ID
  resolutionNote String?       @db.Text
  resolvedAt     DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  raisedBy       User          @relation(fields: [raisedById], references: [id])

  @@index([status])
  @@index([raisedById])
}
```

### 11.3 Referral

Tracks referral relationships and conversion status.

```prisma
model Referral {
  id              String    @id @default(uuid())
  referrerCode    String    // The referral code of the existing user
  referredUserId  String    @unique  // The new user who used the code
  isConverted     Boolean   @default(false)  // Became a paid subscriber
  convertedAt     DateTime?
  discountApplied Boolean   @default(false)
  createdAt       DateTime  @default(now())

  @@index([referrerCode])
}
```

---

## 12. Indexing Strategy

| Table | Index | Columns | Purpose |
|---|---|---|---|
| User | Primary lookup | `email` | Login, uniqueness check |
| User | State filtering | `verificationStatus` | Admin queue, state routing |
| User | Tier filtering | `tier` | Tier-gated endpoint checks |
| UserProfile | Sector search | `sector` | Business directory filtering |
| UserProfile | State search | `state` | Geographic filtering |
| Listing | Status filtering | `status` | Active listing queries |
| Listing | Commodity search | `commodityType` | Commodity-specific searches |
| Listing | Geographic search | `locationState` | State-based filtering |
| Listing | Full-text search | `search_vector` (GIN) | PostgreSQL full-text search |
| Message | Thread lookup | `threadId` | Fetch all messages in a conversation |
| Message | Timeline ordering | `createdAt` | Chronological message display |
| CommodityPrice | Price lookup | `commodity, state` | Price queries by commodity/location |
| AdminAction | Audit trail | `createdAt` | Chronological admin activity log |

---

## 13. Migration Strategy

### Development Workflow

1. Make changes to `prisma/schema.prisma`
2. Run `npm run db:migrate:dev -- --name descriptive_name`
3. Prisma generates a SQL migration file in `prisma/migrations/`
4. Migration is applied to local database
5. Commit the migration file to Git

### Full-Text Search Migration (Manual SQL)

The PostgreSQL `tsvector` column and GIN index cannot be defined in Prisma schema. A manual SQL migration will be created during Sprint 8 (Listing Search):

```sql
-- Add full-text search vector to Listing table
ALTER TABLE "Listing" ADD COLUMN search_vector tsvector;

-- Create update trigger
CREATE FUNCTION listing_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW."commodityType", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."locationState", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listing_search_trigger
  BEFORE INSERT OR UPDATE ON "Listing"
  FOR EACH ROW EXECUTE FUNCTION listing_search_update();

-- Create GIN index for fast full-text queries
CREATE INDEX idx_listing_search ON "Listing" USING GIN(search_vector);
```

### Migration Naming Convention

```
YYYYMMDDHHMMSS_descriptive_name
Examples:
  20260402120000_initial_schema
  20260416120000_add_listing_search_vector
  20260514120000_add_service_marketplace_tables
```

---

## 14. Seed Data Plan

The seed script (`prisma/seed.ts`) populates reference data needed for the platform to function:

### 20 MVP Commodities
sesame, hibiscus, groundnut, palm-oil, cassava, cocoa, cashew, sorghum, ginger, turmeric, cowpea, maize, soybean, cotton, rubber, timber, iron-ore, granite, limestone, crude-palm-kernel

### 10 Launch States
Lagos, Kano, Abuja, Rivers, Ogun, Kaduna, Oyo, Katsina, Anambra, Delta

### 7 Service Categories
logistics-freight-forwarding, customs-clearance, trade-law, export-import-consulting, commodity-inspection, business-registration, trade-finance-advisory

### Sector Risk Ratings (for Readiness Score)
| Sector | Risk Rating (0–1) | Rationale |
|---|---|---|
| agriculture | 0.90 | Low risk, high volume in Nigeria |
| manufacturing | 0.85 | Moderate complexity |
| logistics | 0.80 | Moderate risk |
| legal | 0.95 | Low risk, regulated |
| services | 0.85 | Moderate complexity |
| mining | 0.75 | Higher risk sector |
| finance | 0.70 | High regulation, higher risk |

### Default Admin Account
A default admin user is created for development with `isAdmin: true`. Credentials are set via environment variables — never hardcoded.

---

## 15. Readiness Score Algorithm

The readiness score (0–100) is calculated automatically at State S5 using three weighted components:

| Component | Weight | Max Points | Calculation |
|---|---|---|---|
| **Profile completeness** | 30% | 30 | Count of filled required fields ÷ total required fields × 30 |
| **Document count** | 40% | 40 | min(documents uploaded ÷ 3, 1) × 40 |
| **Sector risk rating** | 30% | 30 | Sector risk rating value × 30 |

### Badge Level Assignment

| Tier | Readiness Score | Badge Level |
|---|---|---|
| FREE | Any | 1 (Basic) |
| BETA_BUYER | < 60 | 1 |
| BETA_BUYER | 60–79 | 2 |
| BETA_BUYER | ≥ 80 | 2 |
| BETA_SELLER | < 60 | 1 |
| BETA_SELLER | 60–79 | 2 |
| BETA_SELLER | ≥ 80 | 2 |
| BETA_POWER_BUYER | Any | 2 |

---

*Market-Link · Database Design · WebCortex Technologies Limited · v1.0 · April 2026*
