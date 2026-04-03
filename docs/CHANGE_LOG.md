# Market-Link — Backend Change Log
>This document provides a detailed change log for the Market-Link backend, outlining recent updates, bug fixes, and new features. Each entry includes a brief description of the change, the files affected, and the rationale behind the update.
> WebCortex Technologies Limited · v1.0 · April 2026
> For more information, visit [Market-Link Documentation](https://docs.market-link.com).
> This change log is intended for developers, contributors, and stakeholders to track the evolution of the Market-Link backend and understand the context of each change

## [2026-04-03] - v1.0.1
### Added
- Added `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `REFRESH_TOKEN_SECRET`, and `ACCESS_TOKEN_SECRET` to `.env.example` and `.env` files for improved token management. (Files: `.env.example`, `.env`)
- Implemented `SignToken`, `VerifyToken`, and `Destroy` methods in `Session` class to handle token operations separately from session creation. (File: `src/utils/Session.ts`)

### Updated
- Renamed `jwt.ts` in `PROJECT_STRUCTURE.md` to `Session.ts`.