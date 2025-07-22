# Code Refactoring and Optimization Proposals

This document summarizes potential improvements identified after reviewing the current code base. They are organized by area and reference existing files.

## 1. API Route Authentication

- **Observation**: Multiple API routes implement manual authentication logic. For example, `/api/admin/assign-api-key` repeats token extraction and validation logic lines 9–28.
- **Proposal**: Use the existing `withAuth` helper in `lib/api/middleware.ts` to wrap handlers. This reduces duplication and ensures consistent error handling.

## 2. Supabase Client Usage

- **Observation**: Some routes create two clients (`createClient()` for both user session and admin queries). Consolidating this into a single helper would simplify code.
- **Proposal**: Add a small utility in `lib/supabase` to return both the standard and admin clients, or augment `createClient` to accept a role parameter.

## 3. Encryption Helpers

- **Observation**: `lib/crypto.ts` contains both `encryptApiKey` and `encryptForStorage` which share similar logic.
- **Proposal**: Refactor these into a single function with options for return format to avoid code drift.

## 4. Data Caching

- **Observation**: `TECHNICAL_GUIDE.md` mentions Redis caching as a future enhancement. Frequent lookups (e.g., company types in `app/api/analyze/route.ts`) could benefit from caching.
- **Proposal**: Implement Redis-based caching for read-heavy tables to reduce Supabase calls and speed up analysis requests.

## 5. PDF Extraction

- **Observation**: `app/api/extract-pdf/route.ts` processes PDFs entirely in memory.
- **Proposal**: Stream PDF processing or set a file-size limit to avoid large memory spikes and improve stability.

## 6. Cost Estimation Constants

- **Observation**: `calculateCostEstimate` defines a large `costPerKToken` object inside the function (lines 256–459).
- **Proposal**: Move this constant to a separate module so the object is created once and can be imported by other utilities.

## 7. Testing and Linting

- **Observation**: Tests currently fail (see `npm test` results) and ESLint prompts interactively.
- **Proposal**: Fix failing tests and configure `npm run lint` to run non-interactively. Add CI steps to enforce linting and type checks.

## 8. Environment Validation

- **Observation**: Supabase client setup throws errors if environment variables are missing. Centralizing environment validation with a schema (e.g., using Zod) could provide clearer startup checks.

## 9. Logging Utilities

- **Observation**: Routes perform extensive `console.log` calls with request IDs.
- **Proposal**: Introduce a small logging utility that prefixes logs with request IDs and levels, enabling future log sinks or verbose modes.

These suggestions aim to reduce duplication, improve maintainability, and prepare the code base for future scaling.
