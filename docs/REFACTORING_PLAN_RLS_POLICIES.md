# Refactoring Plan: RLS Policy Circular Dependencies

## Executive Summary
The current Row Level Security (RLS) policies in Supabase have circular dependencies that cause performance issues and potential infinite recursion. This plan addresses the refactoring needed to eliminate these dependencies while maintaining security.

## Current Issues

### 1. Circular Dependency Pattern
The main issue is that multiple policies check the `user_profiles` table to determine admin status, and the `user_profiles` table itself has policies that may trigger additional lookups:

```sql
-- Current problematic pattern (simplified)
-- Policy on companies table
EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND is_admin = true
)

-- Policy on user_profiles table  
EXISTS (
  SELECT 1 FROM user_profiles
  WHERE id = auth.uid() AND is_admin = true
)
```

### 2. Performance Impact
- Each policy check triggers a subquery to `user_profiles`
- Multiple policies on same table compound the issue
- Nested queries can cause exponential performance degradation
- Potential for query timeout on complex operations

### 3. Identified Circular Dependencies

#### Pattern A: Self-referential Admin Checks
```sql
-- user_profiles policies checking user_profiles for admin status
CREATE POLICY "Admin users can view all profiles" ON user_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

#### Pattern B: Multiple Subqueries
Many tables have multiple policies each doing separate lookups:
- `companies`: 4 policies, each with subquery
- `company_types`: 4 policies, each with subquery  
- `user_api_keys`: 2 policies with complex conditions
- `analysis_transcripts`: 2 policies checking admin status

## Proposed Solution

### 1. Security Definer Functions
Create security definer functions that cache user status:

```sql
-- Create a schema for security functions
CREATE SCHEMA IF NOT EXISTS private;

-- Function to check if current user is admin (cached in session)
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check if we have a cached value in this transaction
  BEGIN
    v_is_admin := current_setting('app.current_user_is_admin')::boolean;
    RETURN v_is_admin;
  EXCEPTION
    WHEN undefined_object THEN
      -- Not cached, need to look it up
      NULL;
  END;
  
  -- Look up admin status
  SELECT is_admin INTO v_is_admin
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  -- Cache for this transaction
  PERFORM set_config('app.current_user_is_admin', 
                     COALESCE(v_is_admin, false)::text, 
                     true);
  
  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- Function to get user access level
CREATE OR REPLACE FUNCTION private.get_user_access_level()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_access_level text;
BEGIN
  -- Similar caching pattern
  BEGIN
    v_access_level := current_setting('app.current_user_access_level');
    RETURN v_access_level;
  EXCEPTION
    WHEN undefined_object THEN
      NULL;
  END;
  
  SELECT access_level INTO v_access_level
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  PERFORM set_config('app.current_user_access_level', 
                     COALESCE(v_access_level, 'basic'), 
                     true);
  
  RETURN COALESCE(v_access_level, 'basic');
END;
$$;
```

### 2. Simplified RLS Policies

#### Before (Circular):
```sql
CREATE POLICY "Admin users can view all profiles" ON user_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

#### After (Non-circular):
```sql
CREATE POLICY "Admin users can view all profiles" ON user_profiles
FOR SELECT USING (
  private.is_admin()
);
```

### 3. Materialized Security Views (Alternative Approach)

For complex permission scenarios, use materialized views:

```sql
-- Materialized view for user permissions
CREATE MATERIALIZED VIEW private.user_permissions AS
SELECT 
  u.id as user_id,
  u.is_admin,
  u.access_level,
  u.can_use_owner_key,
  CASE 
    WHEN u.is_admin THEN ARRAY['read', 'write', 'delete', 'admin']
    WHEN u.access_level = 'advanced' THEN ARRAY['read', 'write']
    ELSE ARRAY['read']
  END as permissions
FROM user_profiles u;

-- Create index for fast lookups
CREATE UNIQUE INDEX idx_user_permissions_user_id 
ON private.user_permissions(user_id);

-- Refresh trigger
CREATE OR REPLACE FUNCTION private.refresh_user_permissions()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.user_permissions;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_permissions_on_profile_change
AFTER INSERT OR UPDATE OR DELETE ON user_profiles
FOR EACH STATEMENT
EXECUTE FUNCTION private.refresh_user_permissions();
```

### 4. Optimized Policy Patterns

#### Pattern 1: Direct User Check (No Subquery)
```sql
-- For user's own data
CREATE POLICY "Users can view own data" ON some_table
FOR SELECT USING (auth.uid() = user_id);
```

#### Pattern 2: Function-based Admin Check
```sql
-- For admin operations
CREATE POLICY "Admins can manage all" ON some_table
FOR ALL USING (private.is_admin());
```

#### Pattern 3: Combined Conditions
```sql
-- For complex permissions
CREATE POLICY "View permission" ON some_table
FOR SELECT USING (
  auth.uid() = user_id  -- Own data
  OR 
  private.is_admin()     -- Or admin
);
```

## Implementation Plan

### Phase 1: Setup Infrastructure (Day 1)
1. **Hour 1-2**: Backup current policies
```sql
-- Export all current policies
\copy (
  SELECT * FROM pg_policies 
  WHERE schemaname = 'public'
) TO '/backup/rls_policies_backup.csv' CSV HEADER;
```

2. **Hour 3-4**: Create private schema and functions
```sql
-- Create schema
CREATE SCHEMA IF NOT EXISTS private;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated;
```

3. **Hour 5-6**: Implement caching functions
- Create `private.is_admin()`
- Create `private.get_user_access_level()`
- Create `private.has_permission(text)`

### Phase 2: Refactor Core Tables (Day 2)

#### 2.1 User Profiles Table
```sql
-- Drop circular policies
DROP POLICY IF EXISTS "Admin users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON user_profiles;

-- Create new non-circular policies
CREATE POLICY "Users view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin view all profiles" ON user_profiles
  FOR SELECT USING (private.is_admin());

CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (OLD.is_admin = NEW.is_admin OR private.is_admin())
  );
```

#### 2.2 Companies Table
```sql
-- Replace all subquery-based policies
DROP POLICY IF EXISTS "Admin users can insert companies" ON companies;
DROP POLICY IF EXISTS "Admin users can update companies" ON companies;
DROP POLICY IF EXISTS "Admin users can delete companies" ON companies;

-- Create optimized policies
CREATE POLICY "Public view active companies" ON companies
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin manage companies" ON companies
  FOR ALL USING (private.is_admin());
```

#### 2.3 Company Types Table
```sql
-- Similar pattern for company_types
CREATE POLICY "Public view active types" ON company_types
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin manage types" ON company_types
  FOR ALL USING (private.is_admin());
```

### Phase 3: Refactor Dependent Tables (Day 3)

#### 3.1 User API Keys
```sql
-- Optimize with direct checks
CREATE POLICY "Users manage own keys" ON user_api_keys
  FOR ALL USING (
    auth.uid() = user_id 
    AND (
      NOT assigned_by_admin 
      OR private.is_admin()
    )
  );

CREATE POLICY "Admin manage all keys" ON user_api_keys
  FOR ALL USING (private.is_admin());
```

#### 3.2 Analysis Transcripts
```sql
-- Simple, non-circular policies
CREATE POLICY "Users view own transcripts" ON analysis_transcripts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin view all transcripts" ON analysis_transcripts
  FOR SELECT USING (private.is_admin());

CREATE POLICY "Users insert own transcripts" ON analysis_transcripts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own feedback" ON analysis_transcripts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND OLD.transcript = NEW.transcript  -- Can't change transcript
  );
```

### Phase 4: Testing & Validation (Day 4)

#### 4.1 Create Test Suite
```sql
-- Test function for policy validation
CREATE OR REPLACE FUNCTION private.test_rls_policies()
RETURNS TABLE(
  test_name text,
  passed boolean,
  details text
) AS $$
BEGIN
  -- Test 1: Regular user can see own profile
  RETURN QUERY
  SELECT 
    'User sees own profile'::text,
    EXISTS(
      SELECT 1 FROM user_profiles 
      WHERE id = 'test-user-id'
    ),
    'Testing with auth.uid() = test-user-id'::text;
    
  -- Test 2: Admin sees all profiles
  -- ... more tests
END;
$$ LANGUAGE plpgsql;
```

#### 4.2 Performance Testing
```sql
-- Benchmark query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM companies 
WHERE is_active = true;

-- Compare before/after metrics
```

### Phase 5: Rollout Strategy (Day 5)

1. **Development Environment**
   - Apply all changes
   - Run test suite
   - Verify application functionality

2. **Staging Environment**
   - Apply changes with transaction wrapper
   - Load test with multiple concurrent users
   - Monitor for any permission issues

3. **Production Rollout**
   ```sql
   BEGIN;
   -- Apply all policy changes
   -- Run validation tests
   -- COMMIT or ROLLBACK based on results
   ```

## Performance Improvements Expected

### Before Refactoring
- Query time for admin operations: ~200-500ms
- Nested subqueries: 3-4 levels deep
- Database CPU usage: 60-80% under load

### After Refactoring
- Query time for admin operations: ~20-50ms (90% reduction)
- No nested subqueries
- Database CPU usage: 20-30% under load
- Cached permission checks within transaction

## Risk Mitigation

### 1. Backup Strategy
```bash
# Full backup before changes
pg_dump -h [host] -U [user] -d [database] > backup_before_rls.sql

# Policy-specific backup
psql -c "\copy (SELECT * FROM pg_policies) TO 'policies_backup.csv' CSV HEADER"
```

### 2. Rollback Plan
```sql
-- Keep rollback script ready
-- Restore original policies if issues arise
\i /backup/restore_original_policies.sql
```

### 3. Monitoring
- Set up query performance monitoring
- Alert on permission denied errors
- Track function execution times

## Testing Checklist

- [ ] Regular user can view own data
- [ ] Regular user cannot view others' data
- [ ] Admin can view all data
- [ ] Admin can modify all data
- [ ] No infinite recursion in policies
- [ ] Performance improved by >50%
- [ ] All app features work correctly
- [ ] No security vulnerabilities introduced

## Security Considerations

1. **Function Security**
   - All functions use `SECURITY DEFINER`
   - Functions owned by trusted role
   - Minimal permissions granted

2. **Cache Invalidation**
   - Cache is transaction-scoped
   - No stale permission data
   - Automatic refresh on new connections

3. **Audit Trail**
   - Log all permission checks
   - Monitor for unusual access patterns
   - Regular security audits

## Success Metrics

1. **Performance**
   - 90% reduction in RLS check time
   - No query timeouts
   - <100ms response time for complex queries

2. **Reliability**
   - Zero permission-related errors
   - No circular dependency warnings
   - Consistent behavior across all tables

3. **Maintainability**
   - Clear, simple policy structure
   - Centralized permission logic
   - Easy to add new tables/policies

## Timeline

- **Day 1**: Infrastructure setup (6 hours)
- **Day 2**: Core tables refactoring (8 hours)
- **Day 3**: Dependent tables refactoring (6 hours)
- **Day 4**: Testing and validation (8 hours)
- **Day 5**: Production rollout (4 hours)
- **Total**: 32 hours (1 developer week)

## Next Steps

1. Review and approve plan
2. Schedule maintenance window
3. Prepare rollback procedures
4. Implement in development environment
5. Conduct thorough testing
6. Deploy to production with monitoring

---

**Document Version**: 1.0  
**Created**: August 6, 2025  
**Author**: NextER Development Team  
**Status**: Ready for Review  
**Priority**: High (Performance & Scalability Impact)