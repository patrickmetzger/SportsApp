-- Migration 17: Add missing RLS policies for users table
-- These policies were missing, causing issues with login redirects and admin user management

-- 1. Allow users to read their own record (needed for role lookup on login)
-- This MUST come first - without it, users can't even check their own role
CREATE POLICY "Users can read own record" ON users
  FOR SELECT USING (id = auth.uid());

-- 2. Create a SECURITY DEFINER function to check admin status
-- This bypasses RLS to prevent infinite recursion when the admin policy
-- tries to query the users table (which would trigger the same policy again)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Allow admins to view and manage all users (using the function to avoid recursion)
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (is_admin());
