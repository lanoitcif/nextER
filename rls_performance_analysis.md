# RLS Performance Optimization Analysis

## Issue Summary
On July 19, 2025, we attempted to implement RLS performance optimization based on Supabase advisor recommendation. The optimization failed and was rolled back.

## Attempted Optimization
**Original Issue**: `auth.uid()` function re-evaluated for each row in RLS policies  
**Suggested Fix**: Wrap in subquery `(SELECT auth.uid())` to evaluate once per query  
**Expected Benefit**: Reduce query time from seconds to microseconds on large tables

## Implementation
Applied optimization to all RLS policies in:
- `user_profiles` table (7 policies)
- `user_api_keys` table (2 policies)  
- `usage_logs` table (2 policies)
- `system_settings` table (1 policy)

## Failure Analysis
**Symptoms**: 500 Internal Server Error on all affected endpoints
- `GET /rest/v1/user_profiles` - 500 error
- `GET /rest/v1/usage_logs` - 500 error
- Frontend unable to load user profile or usage data

**Root Cause**: The `(SELECT auth.uid())` subquery syntax appears incompatible with Supabase's RLS implementation or creates circular references in policy evaluation.

## Resolution
- **Immediate**: Ran `rollback_rls_policies.sql` to restore original working policies
- **Result**: Service restored, all endpoints functional
- **Time to Resolution**: < 5 minutes

## Lessons Learned
1. **Test RLS changes in development first**: Performance optimizations should be validated in non-production
2. **Supabase-specific syntax**: Generic PostgreSQL optimizations may not work in Supabase's managed environment
3. **Have rollback ready**: Always prepare rollback scripts before applying RLS changes
4. **Monitor after deployment**: Database-level changes can fail silently until queries are executed

## Current Supabase Warnings (January 2025)

After the rollback, Supabase still shows multiple performance warnings:

### 1. Auth RLS Initialization Plan Warnings
- **Issue**: All RLS policies still use `auth.uid()` which re-evaluates for each row
- **Affected Tables**: `user_profiles`, `user_api_keys`, `usage_logs`, `system_settings`  
- **Recommended Fix**: Replace `auth.uid()` with `(SELECT auth.uid())`
- **Status**: **NOT IMPLEMENTED** - Previous attempt caused 500 errors

### 2. Multiple Permissive Policies Warnings  
- **Issue**: Duplicate RLS policies exist for same role/action combinations
- **Examples**: 
  - `user_profiles` has both "Users can view own profile" and "Users can view their own profile"
  - `user_api_keys` has both "Users can manage own API keys" and "Users can manage their own API keys"
- **Impact**: Each policy executes for every query, degrading performance
- **Root Cause**: Historical policy additions without cleanup

## Alternative Approaches
For future performance optimization:
1. **Database indexing**: Add indexes on frequently queried columns
2. **RLS policy consolidation**: Remove duplicate policies before attempting subquery optimization
3. **Query optimization**: Optimize application-level queries instead of RLS
4. **Connection pooling**: Implement proper connection pooling for better performance
5. **Caching layer**: Add Redis or similar caching for frequently accessed data

## Hypothesis: Why Subquery Optimization Failed
Based on the current warnings, our hypothesis for why `(SELECT auth.uid())` caused 500 errors:

1. **Multiple Policy Conflict**: With duplicate policies executing simultaneously, the subquery optimization may have created race conditions or circular references
2. **Supabase Environment Specifics**: The optimization may work in standard PostgreSQL but fail in Supabase's managed environment
3. **Policy Evaluation Order**: The subquery changes how policies are evaluated, potentially breaking the expected execution sequence

**Recommended Next Steps**:
1. First clean up duplicate policies
2. Test subquery optimization on single, clean policies in development
3. Apply gradually with thorough testing at each step

## Status
- **Current State**: Original RLS policies restored and working
- **Performance**: Acceptable for current user load
- **Future**: Performance optimization deferred until thorough testing possible

---
**Date**: July 19, 2025  
**Impact**: Production outage ~5 minutes  
**Resolution**: Complete rollback to working state