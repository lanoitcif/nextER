-- ============================================================================
-- RLS Policy Verification Script
--
-- How to run:
-- 1. Make sure you have applied the migration from
--    `migrations/20250806_refactor_rls_policies.sql`.
-- 2. Run this script using psql. It's recommended to wrap the execution
--    in a transaction so it can be rolled back.
--    `psql [your_connection_string] --single-transaction -f __tests__/sql/test_rls_policies.sql`
--
-- What it does:
-- This script creates a regular user and an admin user, then impersonates
-- them to test the new RLS policies. It prints the results of each test
-- and cleans up all created data. If a test fails, it will likely
-- raise an error and stop execution.
-- ============================================================================

-- Announce the start of testing
\echo '========================================'
\echo '  Running RLS Policy Verification Test  '
\echo '========================================'
\echo ''

-- ============================================================================
-- STEP 1: Setup - Create test users
-- ============================================================================

-- Generate UUIDs for our test users
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SELECT uuid_generate_v4() AS regular_user_id \gset
SELECT uuid_generate_v4() AS admin_user_id \gset

\echo '--> Creating test users...'

-- Insert into auth.users. The `handle_new_user` trigger will create the profiles.
INSERT INTO auth.users (id, email, encrypted_password, role) VALUES
    (:'regular_user_id', 'test_regular@example.com', 'test_password', 'authenticated'),
    (:'admin_user_id', 'test_admin@example.com', 'test_password', 'authenticated');

-- Update the admin user's profile to grant admin privileges
UPDATE public.user_profiles SET is_admin = true, access_level = 'admin' WHERE id = :'admin_user_id';

\echo '--> Test users created:'
\echo '  - Regular User ID:' :'regular_user_id'
\echo '  - Admin User ID:  ' :'admin_user_id'
\echo ''

-- ============================================================================
-- STEP 2: Test Case 1 - REGULAR USER
-- ============================================================================

\echo '-------------------------------------------'
\echo '--- Testing as REGULAR USER...'
\echo '-------------------------------------------'

-- Impersonate the regular user
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub": "' || :'regular_user_id' || '", "role": "authenticated"}', true);

\echo '\n[PASS if 1 row] Can see own profile:'
SELECT COUNT(*)::text || ' rows' FROM public.user_profiles WHERE id = :'regular_user_id';

\echo '\n[PASS if 0 rows] CANNOT see admin profile:'
SELECT COUNT(*)::text || ' rows' FROM public.user_profiles WHERE id = :'admin_user_id';

\echo '\n[PASS if error] CANNOT insert a company:'
-- This should fail with a policy violation error
INSERT INTO public.companies (ticker, name) VALUES ('TEST_TICKER', 'Test Corp Inc.');

-- We must catch the expected error to continue the script
-- This is a workaround for psql's default "stop on error" behavior
DO $$
BEGIN
    INSERT INTO public.companies (ticker, name) VALUES ('TEST_TICKER', 'Test Corp Inc.');
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE '      (Caught expected policy violation error)';
END;
$$;

-- ============================================================================
-- STEP 3: Test Case 2 - ADMIN USER
-- ============================================================================

\echo '\n-------------------------------------------'
\echo '--- Testing as ADMIN USER...'
\echo '-------------------------------------------'

-- Impersonate the admin user
SELECT set_config('request.jwt.claims', '{"sub": "' || :'admin_user_id' || '", "role": "authenticated"}', true);

\echo '\n[PASS if 1 row] Can see regular user profile:'
SELECT COUNT(*)::text || ' rows' FROM public.user_profiles WHERE id = :'regular_user_id';

\echo '\n[PASS if success] Can insert a company:'
INSERT INTO public.companies (ticker, name) VALUES ('TEST_TICKER', 'Test Corp Inc.');
\echo '      (Insert successful)'

\echo '\n[PASS if 1 row] Can see newly created company:'
SELECT COUNT(*)::text || ' rows' FROM public.companies WHERE ticker = 'TEST_TICKER';

-- ============================================================================
-- STEP 4: Cleanup
-- ============================================================================

\echo '\n-------------------------------------------'
\echo '--- Cleaning up test data...'
\echo '-------------------------------------------'

-- Reset role to superuser to perform cleanup
RESET ROLE;

\echo '--> Deleting test company...'
DELETE FROM public.companies WHERE ticker = 'TEST_TICKER';

\echo '--> Deleting test users...'
DELETE FROM auth.users WHERE id = :'regular_user_id' OR id = :'admin_user_id';

\echo '--> Cleanup complete.'
\echo ''
\echo '========================================'
\echo '       Verification Test Complete       '
\echo '========================================'
