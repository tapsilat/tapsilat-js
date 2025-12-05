# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2025.12.5.2] - 2025-12-05

### Added
- **New Features**:
  - `verifyWebhook`: Enhanced webhook signature verification.
  - `healthCheck`: Check API health status.
  - `terminateOrderTerm`: Terminate a specific order term.
  - `orderManualCallback`: Trigger a manual callback for an order.
  - `orderRelatedUpdate`: Update related order reference.
  - `getOrganizationSettings`: Retrieve organization settings.
  - `getOrderTerm`: Retrieve details of a specific order term.
  - **Subscription Management**: Full suite of subscription methods (`createSubscription`, `getSubscription`, `listSubscriptions`, `cancelSubscription`, `redirectSubscription`).

### Changed
- Updated `package.json` version to `2025.12.5.2`.
- Refactored tests to align with project structure.

## [1.0.4] - 2025-06-16

### Changed
- Standardized and improved code documentation across the SDK
- Migrated all type/interface/type alias definitions from src/types.ts to src/types/index.ts
- Improved error handling in refund methods for clarity
- Organized type definitions with proper JSDoc annotations (@category, @summary, @description)
- Deduplicated and consolidated type definitions

### Removed
- src/types.ts file (contents migrated to src/types/index.ts)

## [1.0.3]

### Added
- Initial SDK implementation
- Payment operations (create, get, list, cancel)
- Refund operations (create, get, list)
- Customer operations (CRUD)
- Webhook verification
- TypeScript support
- Comprehensive error handling
- Input validation and sanitization
- Retry mechanism with exponential backoff
- Zero external dependencies

### Security
- Automatic metadata sanitization
- HMAC-SHA256 webhook verification
- Input validation for all requests

## [1.0.0] - 2024-12-XX

### Added
- Initial release of Tapsilat JS SDK
- Full TypeScript support
- Modern fetch-based HTTP client
- Comprehensive test suite
- Documentation and examples 