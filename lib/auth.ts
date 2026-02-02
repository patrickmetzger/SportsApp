import { createClient } from "./supabase/server";
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

export async function getUserRole(userId?: string): Promise<UserRole | null> {
  const supabase = await createClient();

  // If no userId provided, use the effective user ID (handles impersonation)
  const effectiveUserId = userId || (await getEffectiveUserId());

  if (!effectiveUserId) return null;

  const { data, error } = await supabase
    .from("users")
    .select("role, email")
    .eq("id", effectiveUserId)
    .single();

  // If role found in database, return it
  if (!error && data?.role) {
    return data.role as UserRole;
  }

  // If user exists but has no role, log the issue
  if (!error && data && !data.role) {
    console.log("User exists in DB but has NULL role:", data.email);
  }

  // If there's an error (RLS blocking, not found, etc.), log it
  if (error) {
    console.log("Error fetching user role:", error.code, error.message);
  }

  // Note: We intentionally do NOT fall back to auth metadata here because:
  // 1. It can get out of sync with the database (causing wrong redirects)
  // 2. During impersonation, auth metadata would return the admin's role, not the impersonated user's
  // The database is the source of truth for roles.

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
