# NextER Project: Implementation Plan

This plan prioritizes actions based on impact and urgency, focusing on resolving production bugs first, then addressing security and technical debt, followed by feature completion and general housekeeping.

---

## Milestone 1: Stabilize Production and Harden Security (Target: 1-3 days)

This milestone focuses on fixing the critical, user-facing bug and implementing low-effort, high-impact security improvements.

*   **Sub-milestone 1.1: Resolve Android File Upload Bug**
    *   **1.1.1: Setup Debugging Environment:** Use Android Studio's emulator or a physical device with Chrome's remote debugging (`chrome://inspect`) to replicate the issue in a controlled environment.
    *   **1.1.2: Diagnose the Root Cause:** Monitor the network requests and console logs on the Android device when a file is uploaded. Investigate potential causes such as FormData handling differences, file API inconsistencies on Android, or client-side JavaScript errors specific to the mobile browser.
    *   **1.1.3: Implement and Test the Fix:** Apply a code fix. This might involve adjusting the file handling logic in `components/FileUpload.tsx` or the receiving logic in the `/api/extract-text/route.ts` endpoint.
    *   **1.1.4: Cross-Platform Verification:** After fixing, confirm that file uploads still work correctly on desktop browsers (Chrome, Firefox, Safari) and on iOS to ensure the fix has no negative side effects.

*   **Sub-milestone 1.2: Implement Supabase Security Quick Wins**
    *   **1.2.1: Update OTP Expiry:** Navigate to the Supabase Dashboard > Authentication > Settings > Email and set the "OTP expiry" to 3600 seconds (1 hour).
    *   **1.2.2: Enable Leaked Password Protection:** In the Supabase Dashboard > Authentication > Settings > Security, enable the "Enable leaked password protection" feature.
    *   **1.2.3: Document the Changes:** Add a note in `docs/DATABASE_ADMIN.md` confirming that these security settings have been applied as of the current date.

---

## Milestone 2: Comprehensive RLS Policy Overhaul (Target: 3-5 days)

This milestone addresses the significant technical debt and performance/security risk associated with the current RLS policies. This must be done carefully in a non-production environment first.

*   **Sub-milestone 2.1: Preparation and Safety**
    *   **2.1.1: Backup Current Policies:** Before making any changes, export the definitions of all existing RLS policies as a backup SQL file.
    *   **2.1.2: Create a Test Plan:** Document a clear testing protocol that covers all user roles (admin, advanced, basic) and their expected data access permissions for each table.
    *   **2.1.3: Establish a Staging Environment:** Ensure a safe development or staging environment that mirrors production is available for testing these changes without impacting live users.

*   **Sub-milestone 2.2: RLS Policy Cleanup**
    *   **2.2.1: Remove Duplicate Policies:** Carefully review the policies listed in `rls_performance_analysis.md` and `pg_policies`. Write and execute a SQL script to `DROP` all redundant policies.
    *   **2.2.2: Test After Removal:** Execute the test plan from step 2.1.2 to ensure that removing the duplicates did not unintentionally revoke necessary permissions.

*   **Sub-milestone 2.3: RLS Policy Refinement**
    *   **2.3.1: Refactor Admin Policies:** Rewrite all admin-level policies to use the `EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND access_level = 'admin')` pattern to avoid the previously identified infinite recursion issue.
    *   **2.3.2: Comprehensive Testing:** Execute the full test plan again to validate that all user roles have the correct permissions and that admin policies are working as expected.

*   **Sub-milestone 2.4: Production Deployment**
    *   **2.4.1: Schedule Maintenance Window:** If possible, schedule a low-traffic time to apply the changes.
    *   **2.4.2: Apply to Production:** Run the finalized and tested SQL migration script in the production environment.
    *   **2.4.3: Monitor Closely:** Immediately after deployment, monitor application logs and Supabase logs for any RLS-related errors.

---

## Milestone 3: Finalize and Integrate Live Transcription (Target: 2-4 days)

This milestone focuses on taking the newly developed Live Transcription feature from behind its feature flag to a fully integrated and tested part of the application.

*   **Sub-milestone 3.1: Code Review and Finalization**
    *   **3.1.1: Review Implementation:** Conduct a thorough code review of the frontend page and the `/api/live-transcription/` routes.
    *   **3.1.2: Solidify Error Handling:** Implement robust error handling for scenarios like WebSocket disconnections, invalid webcast URLs, or failures from the OpenAI Whisper API.

*   **Sub-milestone 3.2: Functional and Performance Testing**
    *   **3.2.1: Functional Testing:** Test the feature with a variety of public webcast URLs to ensure the audio capture and transcription are reliable.
    *   **3.2.2: Performance Testing:** Test with a long-running (1-hour) audio stream to check for memory leaks or performance degradation on both the client and server.

*   **Sub-milestone 3.3: User-Facing Integration**
    *   **3.3.1: Remove Feature Flag:** Once the feature is deemed stable, remove the feature flag from the codebase to make it accessible to all eligible users.
    *   **3.3.2: Update User Documentation:** Add a section to the `README.md` and `docs/GUIDE.md` explaining the new Live Transcription feature.

---

## Milestone 4: Repository and Documentation Hygiene (Target: 1-2 days)

This final milestone focuses on cleaning up the repository and documentation to improve maintainability and developer experience.

*   **Sub-milestone 4.1: Documentation Consolidation**
    *   **4.1.1: Review All Markdown Files:** Read through all `.md` files to identify outdated information, duplicate content, or opportunities for consolidation.
    *   **4.1.2: Consolidate and Archive:** Merge related documents where appropriate (e.g., combine smaller troubleshooting guides). Move any truly outdated documents to an `archive/` folder within `docs/`.
    *   **4.1.3: Update Index:** Ensure `docs/DOCUMENTATION_INDEX.md` is updated to reflect the new, cleaner documentation structure.

*   **Sub-milestone 4.2: Branch Management**
    *   **4.2.1: Review Remote Branches:** Execute `git branch -r` to list all remote branches.
    *   **4.2.2: Prune Stale Branches:** Following the logic in `docs/REPOSITORY_FINALIZATION_PLAN.md`, delete branches that have been merged or are no longer active to keep the repository clean.
