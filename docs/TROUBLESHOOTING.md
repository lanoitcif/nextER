# Troubleshooting Guide

This guide provides solutions to common issues encountered in the NEaR (Next Earnings Release) application.

## Table of Contents
- [API Key Management Issues](#api-key-management-issues)
- [Session and Authentication Issues](#session-and-authentication-issues)
- [Company Search and Analysis Issues](#company-search-and-analysis-issues)
- [Browser Compatibility Issues](#browser-compatibility-issues)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Database Connection Issues](#database-connection-issues)
- [Pull Request and Development Issues](#pull-request-and-development-issues)

## API Key Management Issues

### API Key Addition Hanging at "Adding..."

**Symptoms:**
- Clicking "Add Key" shows "Adding..." indefinitely (60+ seconds)
- No error message appears
- Browser console may show timeout errors

**Causes:**
- Session authentication timeout
- Browser extensions interfering with requests
- Expired refresh token

**Solutions:**
1. **Refresh the page** - This resets the session and often resolves the issue
2. **Try incognito/private browsing** - Eliminates browser extension interference
3. **Log out and log back in** - Refreshes your authentication session
4. **Check browser console** - Look for specific error messages

**Technical Details:**
- Fixed in commit 8ff8332 by switching to cookie-based authentication
- API routes now use `credentials: 'include'` for proper session handling

### API Key Not Saving

**Symptoms:**
- Key appears to save but doesn't show in the list
- Error message about encryption

**Causes:**
- Invalid API key format
- Encryption secret misconfiguration
- Database write permissions

**Solutions:**
1. **Verify API key format** - Ensure it matches provider requirements
2. **Check encryption secret** - Must be exactly 32 characters in `.env.local`
3. **Verify user permissions** - User must have 'advanced' or 'admin' access level

### Cannot Delete API Key

**Symptoms:**
- Delete button doesn't work
- Key reappears after deletion

**Solutions:**
1. **Refresh the page** and try again
2. **Check if key is assigned by admin** - Admin-assigned keys cannot be deleted by users
3. **Verify session is active** - Log out and back in if needed

## Session and Authentication Issues

### "Session Check Timeout" Errors

**Symptoms:**
- Analysis page shows timeout message
- Random logouts during use
- "Getting session..." hangs

**Causes:**
- Browser configuration
- Network latency
- Session expiry

**Solutions:**
1. **Use a different browser** - Some browsers handle sessions differently
2. **Check network connection** - Ensure stable internet
3. **Clear browser cache and cookies** - Removes stale session data

### "Invalid Refresh Token" Error

**Symptoms:**
- Error banner at top of page
- Forced logout
- Cannot perform any actions

**Causes:**
- Session expired naturally
- Browser cleared cookies
- Multiple tabs with different sessions

**Solutions:**
1. **Log out and log back in** - This is the primary solution
2. **Use single tab** - Avoid multiple tabs with the same account
3. **Check "Remember me"** during login for longer sessions

### 401 Unauthorized Errors

**Symptoms:**
- API calls fail with 401 status
- Features don't work despite being logged in

**Causes:**
- Missing environment variables
- Session/cookie mismatch
- Server configuration issue

**Solutions:**
1. **For developers**: Verify `SUPABASE_SERVICE_ROLE_KEY` is set
2. **For users**: Clear cookies and log in again
3. **Check deployment logs** in Vercel for configuration errors

## Company Search and Analysis Issues

### Company Dropdown Not Appearing

**Symptoms:**
- Typing company name shows no results
- "No companies found" message
- Dropdown never loads

**Causes:**
- Database connection issue
- RLS policies blocking access
- Companies not loaded in database

**Solutions:**
1. **Refresh the page** - Reloads company data
2. **Try a known ticker** - Type "DAL" or "AXP" to test
3. **Check console for errors** - Look for database query failures

### Analysis Types Not Loading

**Symptoms:**
- "Select a company first..." persists after selection
- Analysis type dropdown empty
- Spinner loads indefinitely

**Causes:**
- Alt-tab state reset bug (fixed)
- Database query timeout
- Missing company type associations

**Solutions:**
1. **Don't alt-tab** during selection (issue fixed in latest version)
2. **Select company again** - Sometimes requires re-selection
3. **Use ticker search** instead of company name

### Analysis Hanging

**Symptoms:**
- "Analyzing transcript..." never completes
- No error message appears
- Progress seems stuck

**Causes:**
- LLM provider issues
- Token limit exceeded
- Network timeout

**Solutions:**
1. **Check transcript length** - Very long transcripts may timeout
2. **Try different provider** - Switch between OpenAI/Anthropic/etc
3. **Check API key credits** - Ensure provider account has credits
4. **Break up transcript** - Analyze in smaller sections

## Browser Compatibility Issues

### Extensions Interfering with App

**Symptoms:**
- Random JavaScript errors
- Features work in incognito but not regular browsing
- Fetch requests fail mysteriously

**Common Problematic Extensions:**
- Password managers (LastPass, 1Password)
- Ad blockers
- Privacy extensions
- Developer tools extensions

**Solutions:**
1. **Use incognito/private browsing** - Quickest solution
2. **Disable extensions one by one** - Identify the culprit
3. **Create dedicated browser profile** - For NEaR use only
4. **Whitelist the domain** in extension settings

## Build and Deployment Issues

### TypeScript Compilation Errors

**Symptoms:**
- Build fails with type errors
- "Cannot find module" errors
- Callback function type errors

**Causes:**
- Next.js 15 strict type requirements
- Missing type definitions
- Incorrect imports

**Solutions:**
1. **Add explicit types** to all callback functions
2. **Run `npm run type-check`** locally before deploying
3. **Update dependencies** - `npm update`
4. **Clear `.next` folder** - `rm -rf .next && npm run build`

### Vercel Deployment Failures

**Symptoms:**
- Build succeeds locally but fails on Vercel
- Environment variable errors
- Function size limits exceeded

**Solutions:**
1. **Verify all env vars** are set in Vercel dashboard
2. **Check build logs** for specific errors
3. **Reduce bundle size** - Check for large dependencies
4. **Use Vercel CLI** for local testing: `vercel dev`

## Database Connection Issues

### "No Data Available" Errors

**Symptoms:**
- Tables appear empty
- Queries return no results
- Features missing data

**Causes:**
- RLS policies blocking access
- Database migration pending
- Connection string issues

**Solutions:**
1. **Check Supabase dashboard** - Verify data exists
2. **Review RLS policies** - Ensure proper access rules
3. **Run migrations** - Apply any pending schema changes
4. **Verify connection strings** - Check `.env.local` values

### Slow Query Performance

**Symptoms:**
- Features take long to load
- Timeouts on data fetching
- Spinners everywhere

**Solutions:**
1. **Check Supabase metrics** - Look for slow queries
2. **Add database indexes** - For frequently queried columns
3. **Implement pagination** - Don't load all data at once
4. **Use connection pooling** - For high traffic

## Pull Request and Development Issues

### Encryption/Security PRs Marked as Needed
**Symptoms:**
- PRs claiming encryption improvements are required
- Security warnings about deprecated crypto methods
- Claims about missing database columns

**Causes:**
- Outdated PR information
- Encryption improvements already implemented
- Database schema already updated

**Solutions:**
1. **Verify Current Implementation** - Check `lib/crypto.ts` uses AES-256-GCM
2. **Check Database Schema** - Confirm `default_model` column exists in `user_api_keys`
3. **Close Redundant PRs** - Mark as "already implemented"
4. **Review Recent Commits** - Security fixes were deployed in July 2025

### Multiple PRs for Same Feature
**Symptoms:**
- Duplicate pull requests (e.g., markdown table handling)
- Similar functionality across different PRs
- Conflicting approaches to same problem

**Solutions:**
1. **Compare PR Content** - Identify which implementation is better
2. **Close Duplicates** - Keep the merged or better version
3. **Consolidate Changes** - Merge valuable parts from both if needed

### Documentation PRs with Missing Files
**Symptoms:**
- PRs referencing non-existent files
- Broken documentation links
- Mermaid diagrams for missing workflows

**Solutions:**
1. **Create Missing Files** - Or update references to remove them
2. **Update Documentation Index** - Reflect actual file status
3. **Validate Links** - Ensure all documentation cross-references work

## Getting Additional Help

If these solutions don't resolve your issue:

1. **Check Recent Commits** - Review git log for related fixes
2. **Search Existing Issues** - Check GitHub issues
3. **Enable Debug Logging** - Add `console.log` statements
4. **Contact Support** - Provide:
   - Exact error messages
   - Browser console logs
   - Steps to reproduce
   - Browser and OS information

## Prevention Tips

1. **Keep Browser Updated** - Use latest stable version
2. **Regular Logouts** - Prevents session issues
3. **Single Tab Usage** - Avoid multiple app tabs
4. **Monitor Quotas** - Check LLM provider limits
5. **Test in Incognito** - Identifies extension issues

---

**Last Updated**: July 19, 2025

For development-specific issues, see [CLAUDE_WAKEUP.md](./CLAUDE_WAKEUP.md)
For API-specific issues, see [API.md](./docs/API.md)