# Magic Link Authentication Design

**Date:** 2026-04-20  
**Status:** Approved

## Summary

Replace email/password sign-in with Supabase magic link authentication for all users. Emails are routed through Resend via custom SMTP for branding consistency.

## Architecture

- **Auth method:** `supabase.auth.signInWithOtp()` replaces `signInWithPassword()` (login) and `signUp()` (signup)
- **Email delivery:** Supabase auth emails routed through Resend via custom SMTP — one-time dashboard configuration, no code changes
- **Callback:** Existing `/auth/callback` route handles magic link codes unchanged (same PKCE flow as current email confirmation links)

### Flow

1. User enters email on login or signup page
2. App calls `signInWithOtp()` with appropriate options
3. Supabase sends magic link via Resend
4. User clicks link → `/auth/callback?code=...` → session established → redirect to `/dashboard`

## Login Page (`app/(auth)/login/page.tsx`)

**Remove:**
- Password field and show/hide toggle
- "Remember me" checkbox
- "Forgot password" link

**Change:**
- `signInWithPassword()` → `signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo } })`

**Add:**
- Two-state UI:
  - **Form state:** email field + "Send magic link" button
  - **Sent state:** confirmation message ("Check your inbox — we've sent a magic link to `{email}`") + "Try a different email" link to reset back to form state

## Signup Page (`app/(auth)/signup/page.tsx`)

**Remove:**
- Password field and show/hide toggle

**Change:**
- `signUp({ email, password, options: { data } })` → `signInWithOtp({ email, options: { shouldCreateUser: true, data: { first_name, last_name, role }, emailRedirectTo } })`

**Add:**
- Same two-state UI as login (form → sent confirmation)

**Keep:**
- First name, last name, email, role selector — same layout and styling

## Callback Route (`app/auth/callback/route.ts`)

No changes required. Already handles `code` exchange via `supabase.auth.exchangeCodeForSession(code)`.

## Resend SMTP Configuration (Manual — One-time Setup)

### Resend Dashboard
1. Go to API Keys → create an SMTP key
2. Note the SMTP credentials (host, port, username, password)

### Supabase Dashboard
1. Project Settings → Authentication → SMTP Settings
2. Enable custom SMTP
3. Enter:
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** Resend SMTP key
   - **Sender email:** verified domain address (e.g. `noreply@yourschool.com`)
4. Optionally customize the magic link email template under Authentication → Email Templates

## Existing Users

Existing users who registered with a password are unaffected — Supabase magic link works regardless of whether a password is set. They simply won't use their password anymore.

## Out of Scope

- Custom email template design (can be done separately in Supabase dashboard)
- SMS-based OTP
- Any changes to the `/auth/callback` route
