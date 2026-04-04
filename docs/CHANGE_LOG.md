# Market-Link — Backend Change Log

> This document provides a detailed change log for the Market-Link backend, outlining recent updates, bug fixes, and new features. Each entry includes a brief description of the change, the files affected, and the rationale behind the update.
> WebCortex Technologies Limited · v1.0 · April 2026
> For more information, visit [Market-Link Documentation](https://docs.market-link.com).
> This change log is intended for developers, contributors, and stakeholders to track the evolution of the Market-Link backend and understand the context of each change

## [2026-04-03] - v1.0.1

### Added

- Added `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `REFRESH_TOKEN_SECRET`, and `ACCESS_TOKEN_SECRET` to `.env.example` and `.env` files for improved token management. (Files: `.env.example`, `.env`)
- Implemented `SignToken`, `VerifyToken`, and `Destroy` methods in `Session` class to handle token operations. (File: `src/utils/Session.ts`)
- Implemented jwt verification middleware `(protect)` using the Session class to protect routes and ensure only authenticated users can access certain endpoints. (File: `src/middleware/auth.middleware.ts`)
- OTP generation logic added to `Otp.ts` utility for secure OTP creation. (File: `src/utils/Otp.ts`)
- Added email sending functionality using `nodemailer` in `mail.config.ts` to facilitate OTP delivery. (File: `src/config/mail.config.ts`)
- Created email templates in `template.ts` for consistent and professional OTP emails. (File: `src/mail/template.ts`)
- Implemented EmailService in `email.ts` to handle email sending logic and integrate with the mail configuration. (File: `src/services/email.ts`)
- Added phone number validation in `auth.validation.ts` to ensure valid phone numbers during registration. (File: `src/validations/auth.validation.ts`)
- Implemented OTP verification logic in `auth.service.ts` to validate user-provided OTPs against stored values. (File: `src/services/auth.service.ts`)
- Added `verifyOtp` controller method in `auth.controller.ts` to handle OTP verification requests. (File: `src/controllers/auth.controller.ts`)
- Implemented `referralCode` generation during user registration to allow for referral tracking. (File: `src/services/auth.service.ts`)
- Added `refreshToken` controller method in `auth.controller.ts` to handle token refresh requests. (File: `src/controllers/auth.controller.ts`)
- Implemented token refresh logic in `Session.ts` to allow users to obtain new access tokens using valid refresh tokens. (File: `src/utils/Session.ts`)
- Added route for token refresh in `auth.routes.ts` to enable clients to request new access tokens. (File: `src/routes/auth.routes.ts`)
- Implemented user verification status check in `user.service.ts`. (File: `src/services/user.service.ts`)

### Updated

- Renamed `jwt.ts` in `PROJECT_STRUCTURE.md` to `Session.ts`.
- Updated `auth.controller.ts` to use the revised `Session` class methods. (File: `src/controllers/auth.controller.ts`)
- Refactored token generation in `auth.controller.ts` to utilize the new `Session` class for better security and maintainability. (File: `src/controllers/auth.controller.ts`)
- Refactored Login and Register controllers to use AuthService for handling authentication logic, improving separation of concerns and code organization. (File: `src/controllers/auth.controller.ts`)
- Updated error handling in `auth.service.ts` to provide more specific error messages and handle exceptions more gracefully. (File: `src/services/auth.service.ts`)
