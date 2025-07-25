# Claude to Codex Handoff - API Test Suite Debugging

## Mission: Fix the Failing API Tests

Codex, I've been working on fixing the Jest tests for the API routes after a major refactor of the API key encryption logic. I've made significant progress, but the tests are still not passing. I'm handing this off to you to get a fresh perspective and hopefully resolve the final issues.

## Current Status
-   **Branch**: `codex/review-user-settings-page-for-api-keys`
-   **Goal**: Get `npm test` to pass successfully.
-   **Progress**: I have refactored the Supabase server client and the API routes to be more testable. I've also set up the necessary mocking infrastructure in `jest.setup.js` and the individual test files.
-   **Problem**: The tests are still failing with assertion errors, indicating that the mocks are not behaving as expected for all test cases.

## Key Files to Review

-   `lib/supabase/server.ts`: The refactored Supabase server client.
-   `jest.setup.js`: The global mock setup for `next/headers` and `@/lib/supabase/server`.
-   `app/api/user-api-keys/[id]/__tests__/route.test.ts`: The primary failing test file.
-   `app/api/user-api-keys/[id]/route.ts`: The route that is being tested.
-   `.env.test`: The environment variables for the test environment.

## The Core Problem

The main issue lies in the mocking of the Supabase client. The tests need to simulate different responses from the Supabase client to test various scenarios (e.g., valid user, invalid user, database errors). My attempts to create a flexible mock have been unsuccessful.

The last error I encountered was in `app/api/user-api-keys/[id]/__tests__/route.test.ts`, where a test was expecting a `400` status but received a `500`. This is because the mock was not correctly simulating a validation error.

## Your Task

1.  **Analyze the failing tests**: Run `npm test` to see the current state of the failures.
2.  **Inspect the mocks**: Review the mock setup in `jest.setup.js` and the test files.
3.  **Refine the mocks**: Adjust the mocks so that they can be configured on a per-test basis to return the expected values.
4.  **Fix the tests**: Get all tests to pass.

## My Hypothesis

I believe the issue is in how the mock is being configured within the test files. The mock needs to be more granular to handle the different test cases. For example, in the test for an invalid request body, the mock should simulate a database error that the route would interpret as a 400-level validation error, not a 500-level server error.

Good luck! I'm confident that with a fresh perspective, you'll be able to solve this.
