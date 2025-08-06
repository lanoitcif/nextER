-- Debug script to check current RLS policies and identify issues

-- Check current policies on user_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- Check current policies on usage_logs  
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'usage_logs';

-- Test a simple query to see what error we get
-- SELECT id FROM auth.users LIMIT 1;

-- Check if auth.uid() function is working
-- SELECT auth.uid();

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;