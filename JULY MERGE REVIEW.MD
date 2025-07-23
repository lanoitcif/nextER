# July Merge Review

This document summarizes the key changes introduced across several feature branches compared to `main`. It highlights potential concerns, race conditions, and opportunities for improvement. Use it as a checklist when reviewing the branches for merge.

## 1. System Prompt Editor
- **Overview**: Adds an admin-only dashboard section to edit company type prompts. An API route under `/api/admin/company-prompts` handles updates.
- **Security Concern**: The route currently only checks that the request is authenticated; it does **not** verify the user is an admin. Any logged-in user could modify system prompts. Ensure an admin check similar to the one used in `assign-api-key` is implemented.
- **Opportunity**: Consider auditing the prompts table for concurrency control. Updates should ideally log who changed a prompt and when, perhaps with optimistic locking (e.g., a `version` column) to prevent race conditions.

## 2. PDF Upload
- **Overview**: Introduces a new endpoint for transcript upload and extraction. See `app/api/extract-pdf/route.ts` for implementation.
- **Implementation Notes**:
  - Uses `pdf2json` to parse the PDF, then converts the text to Markdown with `turndown`.
  - Requires a `Bearer` token for authentication.
  - Returns an error if no text is extracted, which helps catch image-only PDFs.
- **Usability Concern**: The current route does not limit extremely large PDFs or enforce a minimum text length check. Users could upload large or empty PDFs and consume resources. Consider validating file size and verifying that `extractedText.length` exceeds a threshold before processing.

## 3. API Key Storage
- **Overview**: Reworks authentication and database access to rely on the Supabase service-role key for server-side operations. The public client remains the same.
- **Key Changes**:
  - `lib/supabase/client.ts` now creates an admin client using `SUPABASE_SERVICE_ROLE_KEY` for API routes.【F:lib/supabase/client.ts†L21-L39】
  - API routes expect `Authorization: Bearer <token>` headers instead of cookies. Example in `app/api/analyze/route.ts` lines verifying the header and token.【F:app/api/analyze/route.ts†L18-L31】
  - Admin routes such as `assign-api-key` enforce an admin check before writing to `user_api_keys`.【F:app/api/admin/assign-api-key/route.ts†L30-L36】
- **Risk**: Exposing the service-role key in any client-side bundle would give elevated database access. Confirm the key is only used server-side and not leaked to the browser.
- **Compatibility Impact**: Switching to header-based auth may break existing clients or stored cookies. Ensure all front-end fetch calls send the header.

## 4. Review Analysis Flow
- **Overview**: Adds an optional second LLM call to critique the first analysis result. Users can toggle between "AI Answer" and "Review" in the dashboard. The server accepts a `reviewPrompt` and returns both the original analysis and the critique.
- **Bug**: UI toggle references `state.viewM` instead of `state.viewMode`, causing the switch to malfunction. Fix the typo before merge.
- **Credential Handling**: The review step reuses the same API key for both calls. If the second provider differs, the call may fail. Consider allowing separate keys or clarifying the flow.

## 5. Database Schema
- No new migrations are included in these branches. The current schema already defines tables for `user_profiles`, `user_api_keys`, `prompts`, `companies`, and `usage_logs` with row-level security enabled.【F:supabase_schema.sql†L8-L30】【F:supabase_schema.sql†L20-L33】

## 6. General Recommendations
- **Authentication Consistency**: Ensure every new API route checks both authentication and authorization. Reuse existing helper functions to avoid discrepancies.
- **Logging & Monitoring**: Add detailed logs for admin actions (e.g., prompt edits, API key assignments) so changes can be audited.
- **Front-End Error Handling**: Many fetch requests log errors to the console but do not surface user-friendly messages. Consider standardizing error feedback in the UI.
- **Testing**: Add integration tests for each new route to verify access control and happy-path behavior.

---

This review should help guide the merge process and highlight areas requiring further attention.
