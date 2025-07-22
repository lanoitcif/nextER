# Refactoring & Optimization Opportunities

This document lists potential improvements identified during a review of the code base.

## API Routes

- **Centralize Authentication** – Many API routes repeat the same logic for verifying the bearer token and fetching the current user. The `withAuth` helper in `lib/api/middleware.ts` could wrap route handlers to remove this duplication.
- **Reusable Admin Check** – Checking whether a user has admin privileges is repeated across admin endpoints. Exposing a small utility (e.g., `requireAdmin`) would simplify these checks.
- **Shared Provider Config** – Components and API routes define the `PROVIDER_MODELS` constant separately. Moving this configuration to a shared file would reduce maintenance overhead.
- **Unified Error Handling** – The routes return `NextResponse.json` with similar error structures. A centralized helper would make responses consistent and logging simpler.

## Frontend

- **Dynamic Imports** – Large components like analysis results pages could be loaded via `next/dynamic` to reduce initial bundle size.
- **Cached Fetches** – Lists that rarely change (companies, prompts) can be cached on the client with SWR or React Query for smoother UX.

## Database

- **Indexes for Analytics** – Consider adding indexes on frequently queried columns such as `usage_logs.user_id` and `provider` to improve query performance.

## Testing

- **Increase Coverage** – Only the user API key routes have tests. Additional tests for admin routes and React components would catch regressions earlier.

These opportunities are not yet implemented but could improve maintainability and performance.
