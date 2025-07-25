# NextER Branch Merge Plan

## Status: In Progress

**Last Updated:** 2025-07-25

This document tracks the ongoing process of merging feature and fix branches into the `main` branch.

---

## 1. Completed Merges

### 1.1. `fix/api-key-storage`
- **Status:** Merged
- **Summary:** This branch introduced token-based authentication for all API routes, replacing the previous cookie-based system. This is a significant security and functionality improvement.
- **Issues Encountered & Fixes:**
  - **Merge Conflict:** A conflict occurred in `TECHNICAL_GUIDE.md` and `app/dashboard/api-keys/page.tsx`. The conflict was resolved by manually merging the changes, prioritizing the token-based authentication logic from the `fix/api-key-storage` branch while preserving other changes from `main`.
  - **Test Failures:** The initial merge caused test failures in the `/api/analyze` route's test suite. The tests were updated to mock the new token-based authentication flow, and all tests now pass.

### 1.2. `codex/fix-user-api-key-functionality`
- **Status:** Merged
- **Summary:** This branch improved the security of the API key encryption by switching from the deprecated `crypto.createCipher` to `crypto.createCipheriv`.
- **Issues Encountered & Fixes:** None. The merge was successful, and all tests passed.

---

## 2. Next Steps

### 2.1. Fix MCP Servers
- **Priority:** High
- **Action:** Before continuing with the merge plan, investigate and resolve the issues with the MCP servers. The exact nature of the problem is not yet known.
- **Sub-tasks:**
  - Investigate the MCP server logs and configuration to identify the root cause of the issue.
  - Implement a fix to resolve the issue.
  - Verify that the MCP servers are functioning correctly.

### 2.2. Merge Feature Branches
- **Priority:** Medium
- **Action:** Merge the following feature branches into `main`:
- **Sub-tasks:**
  - **`feat/system-prompt-editor`:**
    - Checkout the branch and inspect the changes.
    - Merge into `main`.
    - Run tests to verify the changes.
  - **`feature/pdf-upload`:**
    - Checkout the branch and inspect the changes.
    - Merge into `main`.
    - Run tests to verify the changes.
  - **`feature/review-analysis`:**
    - Checkout the branch and inspect the changes.
    - Merge into `main`.
    - Run tests to verify the changes.

### 2.3. Process `codex/` Branches
- **Priority:** Low
- **Action:** The remaining `codex/` branches contain a mix of documentation, refactoring, and feature work. These branches will be reviewed and processed individually.
- **Sub-tasks:**
  - For each `codex/` branch with commits:
    - Inspect the changes.
    - Determine if the changes are still relevant.
    - If relevant, create a pull request for review.
    - If not relevant, close the branch.
  - Close all empty `codex/` branches.

---

## 3. Authentication Audit

The initial authentication audit revealed that the `/api/analyze` route was still using cookie-based authentication. This has been fixed. All API routes now use token-based authentication.

---
