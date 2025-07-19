# Database Administration Guide

This guide provides comprehensive database administration tools and workflows for the NEaR project using proper Supabase tools instead of MCP integrations.

## Setup: Supabase CLI

### Installation
```bash
# Install Supabase CLI
npm install -g supabase

# Login to your account
supabase login

# Link to your project
supabase link --project-ref xorjwzniopfuosadwvfu
```

### Environment Setup
```bash
# Set environment variables for easier access
export SUPABASE_PROJECT_REF="xorjwzniopfuosadwvfu"
export SUPABASE_URL="https://xorjwzniopfuosadwvfu.supabase.co"
```

## Database Inspection Tools

### Performance Monitoring

#### 1. Cache Efficiency Analysis
```bash
# Check overall cache hit rates (should be > 99%)
supabase db inspect cache-hit --project-ref $SUPABASE_PROJECT_REF

# If hit rate < 99%, consider upgrading compute plan
```

#### 2. Index Performance
```bash
# Find unused indexes (candidates for removal)
supabase db inspect unused-indexes --project-ref $SUPABASE_PROJECT_REF

# Analyze index usage patterns
supabase db inspect index-usage --project-ref $SUPABASE_PROJECT_REF

# Check individual index sizes
supabase db inspect index-sizes --project-ref $SUPABASE_PROJECT_REF
```

#### 3. Query Performance
```bash
# Identify slow-running queries
supabase db inspect long-running-queries --project-ref $SUPABASE_PROJECT_REF

# Find queries with highest execution time
supabase db inspect outliers --project-ref $SUPABASE_PROJECT_REF

# Count sequential table scans (should be minimized)
supabase db inspect seq-scans --project-ref $SUPABASE_PROJECT_REF
```

### Storage Analysis

#### 1. Table and Index Sizes
```bash
# View table sizes
supabase db inspect table-sizes --project-ref $SUPABASE_PROJECT_REF

# Estimate record counts per table
supabase db inspect table-record-counts --project-ref $SUPABASE_PROJECT_REF

# Check for table bloat
supabase db inspect bloat --project-ref $SUPABASE_PROJECT_REF
```

#### 2. Vacuum Statistics
```bash
# Check vacuum stats for maintenance needs
supabase db inspect vacuum-stats --project-ref $SUPABASE_PROJECT_REF
```

### Connection and Lock Monitoring

```bash
# Monitor active connections by role
supabase db inspect role-connections --project-ref $SUPABASE_PROJECT_REF

# Check for exclusive locks
supabase db inspect locks --project-ref $SUPABASE_PROJECT_REF

# Identify blocking queries
supabase db inspect blocking --project-ref $SUPABASE_PROJECT_REF
```

## Database Linter (Automated Recommendations)

### Running the Linter
The database linter provides automated performance and security recommendations. Access it through:

1. **Supabase Dashboard**: Navigate to Database → Linter
2. **Direct URL**: https://supabase.com/dashboard/project/xorjwzniopfuosadwvfu/database/linter

### Current Issues (January 2025)

#### High Priority Fixes

**1. Unindexed Foreign Keys**
```sql
-- Add missing foreign key indexes
CREATE INDEX idx_prompts_company_type_id ON prompts(company_type_id);
CREATE INDEX idx_usage_logs_prompt_id ON usage_logs(prompt_id);  
CREATE INDEX idx_user_api_keys_admin_assigned_by ON user_api_keys(admin_assigned_by);
```

**2. Multiple Permissive RLS Policies**
```sql
-- Remove duplicate policies (requires careful analysis first)
-- Example: Keep "Users can view their own profile", remove "Users can view own profile"
DROP POLICY "Users can view own profile" ON user_profiles;
DROP POLICY "Users can manage own API keys" ON user_api_keys;
-- Repeat for all duplicate policies
```

#### Low Priority Cleanup

**Remove Unused Indexes**
```sql
-- Only after confirming they're truly unused
DROP INDEX IF EXISTS idx_user_api_keys_provider;
DROP INDEX IF EXISTS idx_companies_primary_type;
```

## SQL-Based Monitoring Queries

### Performance Analysis
```sql
-- Top 10 slowest queries by total execution time
SELECT 
  query,
  calls,
  total_exec_time,
  total_exec_time / calls as avg_exec_time,
  (total_exec_time / sum(total_exec_time) OVER()) * 100 as pct_total_time
FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;

-- Cache hit rate analysis
SELECT 
  'index hit rate' as name,
  (sum(idx_blks_hit)) / nullif(sum(idx_blks_hit + idx_blks_read),0) * 100 as ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT 
  'table hit rate' as name,
  sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read),0) * 100 as ratio
FROM pg_statio_user_tables;

-- Most frequently called queries
SELECT 
  query,
  calls,
  total_exec_time,
  total_exec_time / calls as avg_exec_time
FROM pg_stat_statements 
ORDER BY calls DESC 
LIMIT 10;
```

### Table and Index Analysis
```sql
-- Table sizes with row counts
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Migration Management

### Creating Migrations
```bash
# Create a new migration for performance improvements
supabase migration new add_missing_foreign_key_indexes

# Apply migrations
supabase db push --project-ref $SUPABASE_PROJECT_REF
```

### Example Migration: Add Missing Indexes
Create `supabase/migrations/YYYYMMDDHHMMSS_add_missing_foreign_key_indexes.sql`:
```sql
-- Add missing foreign key indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompts_company_type_id 
ON prompts(company_type_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_logs_prompt_id 
ON usage_logs(prompt_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_api_keys_admin_assigned_by 
ON user_api_keys(admin_assigned_by);

-- Add comments for documentation
COMMENT ON INDEX idx_prompts_company_type_id IS 'Foreign key index for prompts.company_type_id';
COMMENT ON INDEX idx_usage_logs_prompt_id IS 'Foreign key index for usage_logs.prompt_id';
COMMENT ON INDEX idx_user_api_keys_admin_assigned_by IS 'Foreign key index for user_api_keys.admin_assigned_by';
```

## Monitoring Dashboard Setup

### Key Metrics to Track
1. **Cache Hit Rate**: Should be > 99%
2. **Average Query Time**: Monitor for degradation
3. **Connection Count**: Watch for connection pooling needs
4. **Table Sizes**: Track growth patterns
5. **Index Usage**: Ensure indexes are being used

### Alerting Thresholds
- Cache hit rate < 99% → Consider compute upgrade
- Average query time > 2s → Investigate slow queries
- Connection count > 80% of limit → Implement pooling
- Unused indexes detected → Schedule cleanup

## Regular Maintenance Schedule

### Weekly
- [ ] Run `supabase db inspect cache-hit`
- [ ] Check `supabase db inspect long-running-queries`
- [ ] Monitor table sizes with `supabase db inspect table-sizes`

### Monthly
- [ ] Full linter review in Supabase dashboard
- [ ] Analyze unused indexes
- [ ] Review RLS policy performance
- [ ] Check vacuum statistics

### Quarterly
- [ ] Comprehensive performance review
- [ ] Index optimization analysis
- [ ] Connection pooling assessment
- [ ] Backup and recovery testing

## Alternative to MCP Integration

Instead of using the MCP Supabase server for database administration:

**✅ Use These Tools:**
- Supabase CLI for inspections and migrations
- Supabase Dashboard for visual monitoring
- Direct SQL queries for custom analysis
- Database linter for automated recommendations

**❌ Avoid for Admin Tasks:**
- MCP Supabase server (keep for application logic only)
- Direct database connections from application code
- Manual SQL execution without version control

This approach provides better separation of concerns, proper audit trails, and official tool support.