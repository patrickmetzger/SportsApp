import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import { UserRole } from "./types";
import { cookies } from "next/headers";

export async function getImpersonatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const impersonatedUserId = cookieStore.get("impersonated_user_id");
  return impersonatedUserId?.value || null;
}

export async function getAdminUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const adminUserId = cookieStore.get("admin_user_id");
  return adminUserId?.value || null;
}

export async function isImpersonating(): Promise<boolean> {
  const impersonatedUserId = await getImpersonatedUserId();
  return impersonatedUserId !== null;
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

export async function getEffectiveUserId(): Promise<string | null> {
  // If impersonating, return the impersonated user ID
  const impersonatedUserId = await getImpersonatedUserId();
  if (impersonatedUserId) {
    return impersonatedUserId;
  }

  // Otherwise return the actual authenticated user ID
  const user = await getCurrentUser();
  return user?.id || null;
}

/**
 * Returns all roles held by the given user (from user_roles junction table).
 * Falls back to the single users.role column if the table doesn't exist yet.
 */
export async function getUserRoles(userId?: string): Promise<UserRole[]> {
  const effectiveUserId = userId || (await getEffectiveUserId());
  if (!effectiveUserId) return [];

  const impersonating = await isImpersonating();
  const client = impersonating ? createAdminClient() : await createClient();

  const { data, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", effectiveUserId);

  if (!error && data && data.length > 0) {
    return data.map((r) => r.role as UserRole);
  }

  // Fallback: read from the legacy single-role column
  const { data: userData } = await client
    .from("users")
    .select("role")
    .eq("id", effectiveUserId)
    .single();

  return userData?.role ? [userData.role as UserRole] : [];
}

/**
 * Returns the active role for the current session.
 * Priority order:
 *   1. active_role cookie (set when user manually switches roles)
 *   2. users.role column (the user's primary / default role)
 */
export async function getUserRole(userId?: string): Promise<UserRole | null> {
  // If no userId provided, use the effective user ID (handles impersonation)
  const effectiveUserId = userId || (await getEffectiveUserId());

  if (!effectiveUserId) return null;

  // Check if we're impersonating - if so, use admin client to bypass RLS
  const impersonating = await isImpersonating();
  const client = impersonating ? createAdminClient() : await createClient();

  // 1. Check active_role cookie — only relevant for the actual authenticated user,
  //    not when looking up a specific userId or during impersonation.
  if (!userId && !impersonating) {
    const cookieStore = await cookies();
    const activeRole = cookieStore.get("active_role")?.value as UserRole | undefined;

    if (activeRole) {
      // Validate the cookie role is actually held by this user
      const roles = await getUserRoles(effectiveUserId);
      if (roles.includes(activeRole)) {
        return activeRole;
      }
      // Cookie is stale — fall through to DB lookup
    }
  }

  // 2. Read primary role from users table
  const { data, error } = await client
    .from("users")
    .select("role, email")
    .eq("id", effectiveUserId)
    .single();

  if (!error && data?.role) {
    return data.role as UserRole;
  }

  if (!error && data && !data.role) {
    console.log("User exists in DB but has NULL role:", data.email);
  }

  if (error) {
    console.log("Error fetching user role:", error.code, error.message);
  }

  console.log("No role found in database for user:", effectiveUserId);
  return null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(requiredRole: UserRole | UserRole[]) {
  const user = await requireAuth();
  // Don't pass user.id - let getUserRole handle impersonation
  const role = await getUserRole();

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!role || !allowedRoles.includes(role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return { user, role };
}
