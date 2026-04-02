# Market-Link — API Contract

> Complete REST API endpoint specification for frontend–backend integration.
> WebCortex Technologies Limited · v1.0 · April 2026

---

## 1. Base URL

| Environment | Base URL |
|---|---|
| Local Development | `http://localhost:5000/api/v1` |
| Staging | `https://api-staging.marketlink.ng/v1` |
| Production | `https://api.marketlink.ng/v1` |

All endpoints are prefixed with `/api/v1`. When breaking changes are introduced post-MVP, `/api/v2` will be added. The frontend must always target a specific version prefix.

---

## 2. Authentication

All protected endpoints require the following header:

```
Authorization: Bearer <jwt_access_token>
```

The JWT payload contains:

| Field | Type | Description |
|---|---|---|
| `sub` | string (UUID) | User ID |
| `tier` | string | User tier (FREE, BETA_BUYER, etc.) |
| `verificationStatus` | string | Current verification state |
| `isAdmin` | boolean | Whether the user is a platform admin |
| `iat` | number | Issued at (Unix timestamp) |
| `exp` | number | Expiry (Unix timestamp) |

---

## 3. Standard Response Envelope

**Every** API response follows this format — no exceptions.

### Success Response

| Field | Type | Description |
|---|---|---|
| `success` | boolean | Always `true` for successful responses |
| `data` | object | The response payload |
| `meta.timestamp` | string (ISO 8601) | Server timestamp |
| `meta.requestId` | string | Unique request identifier for debugging |

### Error Response

| Field | Type | Description |
|---|---|---|
| `success` | boolean | Always `false` for error responses |
| `error.code` | string | Machine-readable error code |
| `error.message` | string | Human-readable error description |
| `error.field` | string or null | Specific field that caused the error (for validation errors) |
| `meta.timestamp` | string (ISO 8601) | Server timestamp |
| `meta.requestId` | string | Unique request identifier |

---

## 4. Standard Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `UNAUTHENTICATED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Valid JWT but insufficient permissions |
| `TIER_UPGRADE_REQUIRED` | 403 | Feature requires a higher tier |
| `VERIFICATION_REQUIRED` | 403 | User hasn't completed verification (not MARKETPLACE_ACTIVE) |
| `ACCOUNT_SUSPENDED` | 403 | User account has been suspended by admin |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `VALIDATION_ERROR` | 422 | Request body failed Zod validation |
| `QUOTA_EXCEEDED` | 429 | Monthly AI query or inquiry limit reached |
| `RATE_LIMITED` | 429 | Too many requests from this IP |
| `INVALID_STATE` | 400 | User is not in the correct verification state for this action |
| `INTERNAL_ERROR` | 500 | Server error (no raw stack traces exposed) |

---

## 5. Rate Limiting

| Scope | Limit | Window |
|---|---|---|
| General API | 100 requests | Per minute, per IP |
| OTP resend | 1 request | Per 60 seconds, per phone number |
| OTP verification | 3 attempts | Per 15 minutes, per user |
| AI match refresh | 2 refreshes | Per day, per user |

---

## 6. Endpoint Reference

### 6.1 Authentication

| Method | Path | Auth | Tier | Description | Sprint |
|---|---|---|---|---|---|
| POST | `/auth/register` | None | Any | Create new user account, send OTP | S2 |
| POST | `/auth/verify-otp` | None | Any | Validate OTP, issue JWT | S2 |
| POST | `/auth/login` | None | Any | Login with email + password, issue JWT | S2 |
| POST | `/auth/refresh` | Refresh token | Any | Exchange refresh token for new access token | S2 |
| POST | `/auth/logout` | JWT | Any | Revoke refresh token | S2 |
| POST | `/auth/resend-otp` | None | Any | Resend OTP to phone/email | S2 |

#### POST `/auth/register`

**Request Fields:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string | Yes | Valid email format, unique |
| `phoneNumber` | string | Yes | Nigerian format (+234...), unique |
| `password` | string | Yes | Min 8 chars, 1 uppercase, 1 number |
| `referralCode` | string | No | Valid existing referral code |

**Success Response (201):** Returns `userId`, `verificationStatus: "PENDING_OTP"`, and confirmation that OTP was sent.

**Errors:** `VALIDATION_ERROR` (duplicate email/phone, weak password)

#### POST `/auth/verify-otp`

**Request Fields:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `userId` | string (UUID) | Yes | Existing user in PENDING_OTP state |
| `otpCode` | string | Yes | 6-digit numeric string |

**Success Response (200):** Returns `accessToken`, `refreshToken`, and `verificationStatus: "PENDING_PROFILE"`.

**Errors:** `INVALID_STATE`, `VALIDATION_ERROR` (wrong OTP, expired OTP), `RATE_LIMITED` (3 failures → 15-min lockout)

#### POST `/auth/login`

**Request Fields:**

| Field | Type | Required |
|---|---|---|
| `email` | string | Yes |
| `password` | string | Yes |

**Success Response (200):** Returns `accessToken`, `refreshToken`, `userId`, `verificationStatus`, `tier`, `isAdmin`.

---

### 6.2 Users & Onboarding

| Method | Path | Auth | Tier | Description | Sprint |
|---|---|---|---|---|---|
| POST | `/users/profile` | JWT | Any | Submit business profile (S3) | S3 |
| POST | `/users/documents` | JWT | Any | Request file upload URL (S4) | S3 |
| PUT | `/users/documents/:id/confirm` | JWT | Any | Confirm file uploaded, trigger S5 | S3 |
| GET | `/users/me/status` | JWT | Any | Get current verification status, tier, quota | S2 |
| GET | `/users/:id/profile` | JWT | Verified | View another user's profile (contact hidden for Free) | S6 |
| GET | `/users/me/tis` | JWT | Beta+ | Get own Trade Intelligence Score breakdown | S12 |

#### POST `/users/profile`

**Request Fields:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `businessName` | string | Yes | 2–200 characters |
| `sector` | string | Yes | From allowed sectors list |
| `state` | string | Yes | From 10 launch states |
| `lga` | string | No | Free text |
| `businessDescription` | string | Yes | 20–2000 characters |
| `businessType` | string | Yes | "buyer", "seller", "service_provider", or "mixed" |
| `yearsInOperation` | number | No | Positive integer |
| `commodities` | string[] | Yes | From 20 MVP commodities, min 1 |
| `cacNumber` | string | No | CAC registration number |

**Success Response (200):** Updated user with `verificationStatus: "PENDING_DOCUMENTS"`.

#### POST `/users/documents`

**Request Fields:**

| Field | Type | Required |
|---|---|---|
| `documentType` | string | Yes (from DocumentType enum) |
| `fileName` | string | Yes |
| `mimeType` | string | Yes (application/pdf, image/jpeg, image/png) |
| `fileSize` | number | Yes (max 5MB = 5242880 bytes) |

**Success Response (200):** Returns `uploadUrl` (pre-signed URL or local endpoint), `documentId`, `expiresIn` (seconds).

---

### 6.3 Listings

| Method | Path | Auth | Tier | Description | Sprint |
|---|---|---|---|---|---|
| POST | `/listings` | JWT | Beta Seller | Create a new listing (status: PENDING_REVIEW) | S8 |
| PUT | `/listings/:id` | JWT | Beta Seller | Update own listing (back to PENDING_REVIEW) | S8 |
| DELETE | `/listings/:id` | JWT | Beta Seller | Soft-delete own listing | S8 |
| GET | `/listings/:id` | JWT | Beta+ | View a single listing detail | S8 |
| GET | `/listings/search` | JWT | Beta+ | Full-text search with filters | S9 |
| GET | `/listings/mine` | JWT | Beta Seller | List all own listings with stats | S8 |

#### POST `/listings`

**Request Fields:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `title` | string | Yes | 10–100 characters |
| `commodityType` | string | Yes | From 20 MVP commodities |
| `description` | string | Yes | 50–2000 characters |
| `quantityAvailable` | number | Yes | Positive |
| `quantityUnit` | string | Yes | "kg", "tonne", "bags", "pieces", "litres" |
| `pricePerUnit` | number | Conditional | Required if `priceOnRequest` is false |
| `priceOnRequest` | boolean | Yes | — |
| `minimumOrder` | number | No | Positive |
| `deliveryTerms` | string | Yes | "ex-works", "fob", "cif", "ddp", "negotiable" |
| `qualityGrade` | string | No | Free text |
| `locationState` | string | Yes | From 10 launch states |
| `validUntil` | string (ISO date) | Yes | Between today and today + 90 days |
| `photos` | string[] | No | Max 5 items, file references |

#### GET `/listings/search`

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `q` | string | Free-text search query |
| `commodity` | string | Filter by commodity type |
| `state` | string | Filter by location state |
| `minPrice` | number | Minimum price per unit |
| `maxPrice` | number | Maximum price per unit |
| `deliveryTerms` | string | Filter by delivery terms |
| `sortBy` | string | "relevance", "date", "price_asc", "price_desc" |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 50) |

---

### 6.4 Inquiries

| Method | Path | Auth | Tier | Description | Sprint |
|---|---|---|---|---|---|
| POST | `/inquiries` | JWT | Beta Buyer | Send inquiry on a listing (quota enforced) | S9 |
| GET | `/inquiries` | JWT | Beta+ | List all sent/received inquiries | S9 |
| PUT | `/inquiries/:id/status` | JWT | Beta+ | Update inquiry status | S9 |

---

### 6.5 Secure Messaging

| Method | Path | Auth | Tier | Description | Sprint |
|---|---|---|---|---|---|
| POST | `/messages` | JWT | Beta+ | Send an encrypted message | S10 |
| GET | `/messages/thread/:userId` | JWT | Beta+ | Get all messages in a thread | S10 |
| GET | `/messages/threads` | JWT | Beta+ | List all message threads with last message + unread count | S10 |

---

### 6.6 Market Pulse

| Method | Path | Auth | Tier | Description | Sprint |
|---|---|---|---|---|---|
| GET | `/market-pulse/prices` | JWT | Any | Get commodity prices (Free: 7-day lag, Beta: live) | S6 |
| GET | `/market-pulse/history` | JWT | Beta+ | Get price history for a commodity/state | S6 |
| POST | `/market-pulse/alerts` | JWT | Beta+ | Create a price alert | S12 |

**GET `/market-pulse/prices` Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `commodities` | string | Comma-separated commodity slugs |
| `states` | string | Comma-separated state names |

---

### 6.7 Services Marketplace

| Method | Path | Auth | Tier | Description | Sprint |
|---|---|---|---|---|---|
| POST | `/services` | JWT | Beta Seller | Create a service listing | S12 |
| GET | `/services/search` | JWT | Beta+ | Search service providers | S12 |
| GET | `/services/:id` | JWT | Beta+ | View a service listing | S12 |
| GET | `/services/mine` | JWT | Beta Seller | List own service listings | S12 |
| POST | `/services/bookings` | JWT | Beta+ | Create a service booking | S13 |
| PUT | `/services/bookings/:id/status` | JWT | Beta+ | Update booking status | S13 |

---

### 6.8 AI Features

| Method | Path | Auth | Tier | Description | Sprint |
|---|---|---|---|---|---|
| GET | `/ai/matches` | JWT | Beta+ | Get current AI match recommendations | S15 |
| POST | `/ai/matches/refresh` | JWT | Beta+ | Trigger on-demand match refresh (max 2/day) | S15 |
| PUT | `/ai/matches/:id/feedback` | JWT | Beta+ | Submit thumbs up/down match feedback | S15 |
| POST | `/ai/market-query` | JWT | Beta+ | AI-powered market intelligence query | S16 |
| POST | `/ai/service-connector` | JWT | Beta+ | AI-powered service provider matching | S16 |

---

### 6.9 Payments

| Method | Path | Auth | Tier | Description | Sprint |
|---|---|---|---|---|---|
| POST | `/payments/subscription` | JWT | Verified | Create Paystack payment reference | S14 |
| POST | `/payments/webhook` | Paystack Signature | None | Paystack webhook handler | S14 |
| GET | `/payments/history` | JWT | Any | Get payment history | S14 |

---

### 6.10 Admin Endpoints

All admin endpoints require `isAdmin: true` on the JWT.

| Method | Path | Description | Sprint |
|---|---|---|---|
| GET | `/admin/queue` | Get paginated verification queue with SLA flags | S4 |
| GET | `/admin/users/:id` | Get full user profile + document download URLs | S4 |
| POST | `/admin/queue/:id/approve` | Approve user → trigger S7 | S4 |
| POST | `/admin/queue/:id/reject` | Reject user with reason → email notification | S4 |
| POST | `/admin/queue/:id/request-docs` | Request more documents → email notification | S4 |
| GET | `/admin/users` | List all users with filters | S5 |
| POST | `/admin/users/:id/suspend` | Suspend a user account | S5 |
| POST | `/admin/users/:id/change-tier` | Manually change user tier | S5 |
| GET | `/admin/listings/pending` | Get pending listing review queue | S8 |
| POST | `/admin/listings/:id/approve` | Approve a listing | S8 |
| POST | `/admin/listings/:id/reject` | Reject a listing with reason | S8 |
| POST | `/admin/market-pulse/price` | Manually enter a commodity price | S6 |
| GET | `/admin/market-pulse/data-health` | Get data freshness status for all commodity/state pairs | S6 |
| GET | `/admin/analytics/funnel` | Verification funnel drop-off data | S5 |
| GET | `/admin/analytics/mrr` | Monthly recurring revenue by tier | S14 |
| GET | `/admin/analytics/ai-usage` | AI query usage and cost estimates | S16 |

---

## 7. Pagination

All list endpoints support pagination:

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 20 | Items per page (max 50) |

The response includes pagination metadata:

| Field | Type | Description |
|---|---|---|
| `meta.total` | number | Total number of matching records |
| `meta.page` | number | Current page number |
| `meta.limit` | number | Items per page |
| `meta.totalPages` | number | Total number of pages |
| `meta.hasNext` | boolean | Whether more pages exist |

---

## 8. File Upload Flow

File uploads (documents, listing photos) follow a two-step process:

1. **Request upload URL:** Client calls the relevant endpoint to get a file upload URL
2. **Upload the file:** Client uploads the file directly to the returned URL (PUT request with file body)
3. **Confirm upload:** Client calls the confirm endpoint to mark the file as uploaded

In local development, files are stored in the `/uploads` directory. In production, files are stored in S3 with pre-signed upload URLs.

---

*Market-Link · API Contract · WebCortex Technologies Limited · v1.0 · April 2026*
