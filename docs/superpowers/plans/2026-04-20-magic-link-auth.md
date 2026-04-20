# Magic Link Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace email/password sign-in with Supabase magic link authentication on both the login and signup pages.

**Architecture:** Call `supabase.auth.signInWithOtp()` instead of `signInWithPassword()` / `signUp()`. After submitting an email, show a "check your inbox" confirmation state. The existing `/auth/callback` route handles the magic link click unchanged.

**Tech Stack:** Next.js 14 (App Router), Supabase Auth (`@supabase/ssr`), TypeScript, Tailwind CSS

---

## Files Changed

| File | Action | What changes |
|---|---|---|
| `app/(auth)/login/page.tsx` | Modify | Remove password UI; add sent state; use `signInWithOtp` |
| `app/(auth)/signup/page.tsx` | Modify | Remove password UI; add sent state; use `signInWithOtp` |
| `app/auth/callback/route.ts` | No change | Already handles magic link code exchange |

---

### Task 1: Update login page to use magic link

**Files:**
- Modify: `app/(auth)/login/page.tsx`

The new login page has two states: a form state (email input) and a sent state (confirmation). It calls `signInWithOtp` with `shouldCreateUser: false` so only existing users can log in. It also handles the `?error=auth_callback_error` query param that the callback route sets on failure.

- [ ] **Step 1: Replace `app/(auth)/login/page.tsx` with the following**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('error') === 'auth_callback_error') {
      setError('Your magic link has expired or is invalid. Please request a new one.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Navy with Logo Card */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 items-center justify-center p-12">
        <div className="bg-white rounded-2xl p-8 shadow-card-lg max-w-sm w-full">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-navy-900 rounded-xl flex items-center justify-center">
              <span className="text-teal-400 font-bold text-2xl">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy-900">SchoolSports</h1>
              <p className="text-slate-500">Management Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - White with Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center">
              <span className="text-teal-400 font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy-900">SchoolSports</h1>
            </div>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-8 h-8 text-teal-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your inbox</h2>
              <p className="text-slate-500 mb-6">
                We sent a magic link to{' '}
                <span className="font-medium text-slate-700">{email}</span>
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Sign In.</h2>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-10 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="abc@mail.com"
                    />
                    <EnvelopeIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Sending...' : 'Send magic link'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-500">
                  Don't have an account?{' '}
                  <a href="/signup" className="text-teal-600 hover:text-teal-700 font-medium">
                    Create account
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Start the dev server and verify the login page renders**

```bash
npm run dev
```

Open `http://localhost:3000/login`. Expected:
- Single email field and "Send magic link" button visible
- No password field, no "Forgot password" link, no "Remember me" checkbox

- [ ] **Step 3: Verify error state for expired magic link**

Open `http://localhost:3000/login?error=auth_callback_error`. Expected:
- Red error banner: "Your magic link has expired or is invalid. Please request a new one."

- [ ] **Step 4: Verify sent state**

Enter any email address and click "Send magic link". Expected:
- Form is replaced by the confirmation state: envelope icon, "Check your inbox" heading, the submitted email address, and a "Try a different email" link
- Clicking "Try a different email" returns to the form with a blank email field

- [ ] **Step 5: Commit**

```bash
git add app/\(auth\)/login/page.tsx
git commit -m "feat: replace password login with magic link"
```

---

### Task 2: Update signup page to use magic link

**Files:**
- Modify: `app/(auth)/signup/page.tsx`

Same two-state pattern as login. Calls `signInWithOtp` with `shouldCreateUser: true` and passes `first_name`, `last_name`, and `role` as user metadata — exactly what the old `signUp` call passed via `options.data`.

- [ ] **Step 1: Replace `app/(auth)/signup/page.tsx` with the following**

```tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { UserRole } from '@/lib/types';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
            role,
          },
        },
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Navy with Logo Card */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 items-center justify-center p-12">
        <div className="bg-white rounded-2xl p-8 shadow-card-lg max-w-sm w-full">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-navy-900 rounded-xl flex items-center justify-center">
              <span className="text-teal-400 font-bold text-2xl">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy-900">SchoolSports</h1>
              <p className="text-slate-500">Management Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - White with Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center">
              <span className="text-teal-400 font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy-900">SchoolSports</h1>
            </div>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-8 h-8 text-teal-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your inbox</h2>
              <p className="text-slate-500 mb-6">
                We sent a magic link to{' '}
                <span className="font-medium text-slate-700">{email}</span>
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Create Account.</h2>
                <p className="text-slate-500 mt-2">Start your journey with us</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1.5">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-10 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="abc@mail.com"
                    />
                    <EnvelopeIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1.5">
                    I am a
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  >
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                    <option value="coach">Coach</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Sending...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-500">
                  Already have an account?{' '}
                  <a href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
                    Sign in
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the signup page renders**

Open `http://localhost:3000/signup`. Expected:
- First name, last name, email, role selector visible
- No password field or show/hide toggle
- "Create Account" button present

- [ ] **Step 3: Verify sent state on signup**

Fill in all fields and click "Create Account". Expected:
- Form replaced by confirmation: envelope icon, "Check your inbox" heading, the submitted email, "Try a different email" link

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/signup/page.tsx
git commit -m "feat: replace password signup with magic link"
```

---

### Task 3: Configure Resend SMTP in Supabase (manual)

This task has no code changes — it is a one-time configuration in two dashboards.

- [ ] **Step 1: Create a Resend SMTP key**

1. Go to the Resend dashboard → API Keys
2. Click "Add API Key" and choose type **SMTP**
3. Copy the generated SMTP password (shown only once)

- [ ] **Step 2: Configure Supabase to use Resend SMTP**

1. Go to your Supabase project → Project Settings → Authentication
2. Scroll to **SMTP Settings** and enable **Custom SMTP**
3. Enter:
   - **Sender name:** SchoolSports (or whatever you want users to see)
   - **Sender email:** a verified address on your Resend domain (e.g. `noreply@yourdomain.com`)
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** the SMTP key from Step 1
4. Click Save

- [ ] **Step 3: Verify email delivery**

Go to `http://localhost:3000/login`, enter your own email, click "Send magic link". Expected:
- Confirmation state appears
- You receive an email from your configured sender address
- Clicking the link in the email signs you in and redirects to `/dashboard`

- [ ] **Step 4: (Optional) Customize the magic link email template**

In Supabase → Authentication → Email Templates → Magic Link, you can edit the subject and body to match your brand. The default template works fine to start.
