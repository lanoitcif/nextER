# Branch Review Plan

This document summarizes the current branches listed in `BRANCH_MERGE_PLAN.md` and the priority for merging them. It is intended for the senior developer prior to reviewing the branches and issuing pull requests.

## Local Branches

- `main` – primary branch. Currently identical to `work` at commit `ddb7f9c`.
- `work` – development branch. No divergence from `main`.

There is no `origin` remote configured, so no remote branches are available in this repository.

## Remote Branches Mentioned in BRANCH_MERGE_PLAN.md
The previous merge plan references several branches that would exist on the remote. They are listed below with the potential conflicts and recommended order of review.

### Priority 1 – Security and Infrastructure
1. **`codex/review-and-resolve-rls-warnings-from-supabase`**
   - Contains fixes for RLS and documentation.
   - Conflicts with local `enable_rls_security.sql`.
   - **Action**: review differences, keep local script, integrate useful documentation.

### Priority 2 – Feature Audits
2. **`codex/review-and-audit-feature-branches`**
   - Audit branch only, likely not meant to merge.
   - **Action**: use as reference and then close.

### Priority 3 – Active Features
3. **`feature/pdf-upload`**
   - Adds PDF upload functionality.
   - Potential overlap with local transcript upload commit (`b32016e`).
   - **Action**: merge PDF-specific logic without duplicating existing upload handling.
4. **`feat/system-prompt-editor`**
   - System prompt editing functionality.
   - Low conflict risk.
   - **Action**: merge once base security updates are applied.
5. **`feature/review-analysis`**
   - Updates review analysis features.
   - Should be tested against cookie-based auth.
   - **Action**: merge after verifying API compatibility.
6. **`fix/api-key-storage`**
   - Fixes API key storage; high risk of conflict with new cookie-auth pattern.
   - **Action**: carefully update to cookie-based auth before merging.

### Priority 4 – Older or Stale Branches
- Any remaining `codex/*` branches older than a week likely contain minor fixes.
- **Action**: cherry-pick useful commits if needed, otherwise close.

## Recommended Merge Sequence
1. Push local changes from `main` to the upstream repository.
2. Review `codex/review-and-resolve-rls-warnings-from-supabase` for documentation improvements.
3. Integrate low-risk features (`feat/system-prompt-editor` first).
4. Address higher risk branches (`fix/api-key-storage` and `feature/pdf-upload`) after verifying authentication updates.
5. Clean up obsolete or redundant branches.
