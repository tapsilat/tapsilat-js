# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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