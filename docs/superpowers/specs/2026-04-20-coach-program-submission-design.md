# Coach Program Submission Design

**Date:** 2026-04-20  
**Status:** Approved

## Summary

Coaches can create programs that go into a `pending` state awaiting school admin approval. School admins review pending programs in the existing Pending Approvals section. Coaches are notified on approve/reject and can edit and resubmit rejected programs.

## Database

### Migration: Add columns to `summer_programs`

```sql
ALTER TABLE summer_programs
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
```

- `status` defaults to `'approved'` so all existing school admin-created programs are unaffected.
- `submitted_by` is null for school admin-created programs, set to the coach's user ID for coach-submitted programs.
- `rejection_reason` is null unless a school admin provides one on rejection.

### RLS Policies

- **Public visibility**: only `status = 'approved'` programs are publicly visible (update existing "Anyone can view programs" policy to add this filter).
- **Coach INSERT**: coaches can create programs for their own school with `status = 'pending'`.
- **Coach SELECT**: coaches can view programs where `submitted_by = auth.uid()` (in addition to programs they're assigned to via `program_coaches`).
- **Coach UPDATE**: coaches can update programs where `submitted_by = auth.uid()` AND `status IN ('pending', 'rejected')` (for edits/resubmission). On resubmission, status resets to `'pending'` and `rejection_reason` is cleared.
- **School admin UPDATE**: school admins can update `status` and `rejection_reason` on programs belonging to their school.

## Coach Program Creation

### New page: `/dashboard/coach/programs/new`

- Server component, requires `coach` role
- Fetches the coach's `school_id` from `users` table
- Renders `CoachProgramForm` (new client component, adapted from `SchoolAdminProgramForm`)
- On submit, calls `POST /api/coach/programs` which:
  - Inserts into `summer_programs` with `status = 'pending'`, `submitted_by = coach_id`, `school_id = coach's school_id`
  - Inserts into `program_coaches` with `coach_id` and `role = 'head'`
  - Redirects coach to `/dashboard/coach/programs`

### `CoachProgramForm` component (`components/coach/CoachProgramForm.tsx`)

Same fields as `SchoolAdminProgramForm`: name, description, start date, end date, registration deadline, cost, header image, program image. No coach assignment field (coach is automatically set to themselves).

### "Add Program" button

Add a "+ Submit Program" button to the coach's programs page (`/dashboard/coach/programs/page.tsx`) linking to `/dashboard/coach/programs/new`.

## Coach Programs View

### Extended programs list (`/dashboard/coach/programs`)

Currently fetches programs via `program_coaches`. Extend the query to also fetch programs where `submitted_by = coach_id`. Deduplicate (a coach-submitted approved program will appear in both queries).

Each program card shows a status badge:
- `pending` — amber badge: "Awaiting Approval"
- `approved` — green badge: "Approved" (or no badge for clean look)
- `rejected` — red badge: "Not Approved", with rejection reason shown below, and an "Edit & Resubmit" button

### Resubmission: `/dashboard/coach/programs/[id]/edit`

- Only accessible if `submitted_by = coach_id` AND `status IN ('pending', 'rejected')`
- Same form as creation
- On submit, calls `PATCH /api/coach/programs/[id]` which sets `status = 'pending'`, clears `rejection_reason`, updates all fields

## School Admin Pending Approvals

### Extended page: `/school-admin/pending-approvals`

Add a **Pending Programs** section below the existing assistant coaches section.

Query: `summer_programs` where `school_id = admin's school_id` AND `status = 'pending'`, joined with `users` (via `submitted_by`) for coach name.

Each program card shows: program name, submitting coach name, date range, cost.

Actions:
- **Approve** → `POST /api/school-admin/programs/[id]/approve`
  - Sets `status = 'approved'`
  - Sends coach notification email: "Your program [name] has been approved"
- **Reject** → inline reason input + confirm → `POST /api/school-admin/programs/[id]/reject`
  - Sets `status = 'rejected'`, stores `rejection_reason`
  - Sends coach notification email: "Your program [name] was not approved" + reason if provided

### New API routes

- `POST /api/school-admin/programs/[id]/approve` — requires `school_admin` role, verifies program belongs to admin's school
- `POST /api/school-admin/programs/[id]/reject` — requires `school_admin` role, accepts `{ reason?: string }` body

## Notifications

Both approval and rejection emails sent via Resend using the existing `resend` client in `lib/resend.ts`.

**Approval email:**
- To: coach's email
- Subject: `Your program "[name]" has been approved`
- Body: brief confirmation, link to the program

**Rejection email:**
- To: coach's email
- Subject: `Your program "[name]" was not approved`
- Body: rejection reason (if provided), encouragement to edit and resubmit, link to edit page

## Out of Scope

- School admins editing a coach-submitted program (they approve or reject only)
- Coach assigning other coaches during submission (handled post-approval by school admin)
- Push/in-app notifications (email only)
