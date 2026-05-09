-- Migration 28: Multi-role support via user_roles junction table
-- Users can hold multiple roles simultaneously (e.g. coach AND school_admin).
-- The existing users.role column remains as a "primary" or "default" role for
-- backwards-compatibility; active_role cookie overrides it at session time.

-- Junction table: one row per (user, role) pair
CREATE TABLE IF NOT EXISTS user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Backfill: seed one row per existing user from their current users.role
INSERT INTO user_roles (user_id, role)
SELECT id, role
FROM users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles(user_id);

-- RLS: users can read their own roles; admins can manage all
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view their own roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admins can manage all roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
