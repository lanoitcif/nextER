# NextER Branch Merge Plan

## Status: In Progress

**Last Updated:** 2025-07-25

This document tracks the ongoing process of merging feature and fix branches into the `main` branch.

---

## 1. Completed Tasks

### 1.1. MCP Server Fixes
- **Status:** Completed
- **Summary:** Investigated and resolved issues with the MCP servers. All servers (`github-mcp-server`, `mcp-openweather`, `context7`) are now running correctly.

### 1.2. Merged Branches
- **`fix/api-key-storage`:** Merged. Introduced token-based authentication.
- **`codex/fix-user-api-key-functionality`:** Merged. Improved API key encryption.
- **`feat/system-prompt-editor`:** Merged. Added a system prompt editor to the admin dashboard.
- **`feature/pdf-upload`:** Merged. Added PDF upload functionality.
- **`feature/review-analysis`:** Merged. Added a feature to allow a second LLM to review the initial analysis.

---

## 2. Next Steps

### 2.1. Install `gh` CLI
- **Priority:** High
- **Action:** The `gh` command is required to create pull requests for the remaining `codex/` branches.
- **Sub-tasks:**
  - Find the appropriate installation method for the `gh` CLI on this system.
  - Install the `gh` CLI.
  - Authenticate the `gh` CLI with GitHub.

### 2.2. Process `codex/` Branches
- **Priority:** Medium
- **Action:** The remaining `codex/` branches contain a mix of documentation, refactoring, and feature work. These branches will be reviewed and processed individually.
- **Sub-tasks:**
  - For each `codex/` branch with commits:
    - Create a pull request for review.
    - Review the pull request.
    - Merge the pull request if it's approved.
    - Delete the branch after merging.
  - Close all empty `codex/` branches.

---

## 3. `codex/` Branch Summary

### 3.1. Branches with Commits (to be processed)
- `origin/codex/fix-company-search-and-transcript-submission-issues`
- `origin/codex/implement-live-transcription-for-earnings-calls`
- `origin/codex/improve-markdown-to-tables-conversion`
- `origin/codex/plan-and-implement-qa-only-feature`
- `origin/codex/review-and-audit-feature-branches`
- `origin/codex/review-and-prioritize-open-branches-for-merging`
- `origin/codex/review-and-resolve-rls-warnings-from-supabase`
- `origin/codex/review-or-create-admin-page-mermaid-chart`
- `origin/codex/review-or-create-api-key-page-documentation`
- `origin/codex/review-user-settings-page-for-api-keys`

### 3.2. Empty Branches (to be closed)
- `origin/codex/fix-failing-api-test-suite`
- `origin/codex/fix-failing-jest-tests-for-api-routes`
- `origin/codex/review-and-improve-admin-tools-for-key-assignment`
- `origin/nif5k8-codex/improve-markdown-to-tables-conversion`

---