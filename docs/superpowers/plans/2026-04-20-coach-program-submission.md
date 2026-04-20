# Coach Program Submission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow coaches to submit programs for school admin approval, with email notifications on approve/reject and the ability to edit and resubmit rejected programs.

**Architecture:** Add `status`, `submitted_by`, and `rejection_reason` columns to `summer_programs`. Coaches submit via a new API route; programs start as `pending`. School admins approve/reject via new API routes from an extended Pending Approvals page. Resend sends email notifications on each decision.

**Tech Stack:** Next.js 14 App Router, Supabase (RLS + server client), TypeScript, Tailwind CSS, Resend

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase_migration_24_coach_program_submission.sql` | Create | DB schema + RLS changes |
| `components/coach/CoachProgramForm.tsx` | Create | Coach program create/edit form |
| `app/api/coach/programs/route.ts` | Create | POST: create pending program |
| `app/api/coach/programs/[id]/route.ts` | Create | PATCH: resubmit edited program |
| `app/dashboard/coach/programs/new/page.tsx` | Create | Coach new program page |
| `app/dashboard/coach/programs/[id]/edit/page.tsx` | Create | Coach edit program page |
| `components/coach/CoachProgramsList.tsx` | Modify | Add status badges + resubmit button |
| `app/dashboard/coach/page.tsx` | Modify | Fetch submitted programs + merge with assigned |
| `components/school-admin/PendingProgramsList.tsx` | Create | Pending programs list with approve/reject |
| `app/api/school-admin/programs/[id]/approve/route.ts` | Create | POST: approve program + email coach |
| `app/api/school-admin/programs/[id]/reject/route.ts` | Create | POST: reject program + email coach |
| `app/school-admin/pending-approvals/page.tsx` | Modify | Add pending programs section |

---

### Task 1: Database migration

**Files:**
- Create: `supabase_migration_24_coach_program_submission.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase_migration_24_coach_program_submission.sql

-- Add status, submitted_by, and rejection_reason to summer_programs
ALTER TABLE summer_programs
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update public visibility: only approved programs are publicly visible
-- (existing programs default to 'approved', so nothing breaks)
DROP POLICY IF EXISTS "Anyone can view programs" ON summer_programs;
CREATE POLICY "Anyone can view programs" ON summer_programs
  FOR SELECT USING (status = 'approved');

-- Coaches can view programs they submitted (any status)
CREATE POLICY "Coaches can view their submitted programs" ON summer_programs
  FOR SELECT USING (submitted_by = auth.uid());

-- Coaches can submit programs for their own school
CREATE POLICY "Coaches can submit programs" ON summer_programs
  FOR INSERT WITH CHECK (
    status = 'pending'
    AND submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'coach'
      AND u.school_id = summer_programs.school_id
    )
  );

-- Coaches can update their own pending or rejected programs (resubmission resets to pending)
CREATE POLICY "Coaches can resubmit their programs" ON summer_programs
  FOR UPDATE USING (
    submitted_by = auth.uid()
    AND status IN ('pending', 'rejected')
  ) WITH CHECK (
    status = 'pending'
    AND submitted_by = auth.uid()
  );
```

- [ ] **Step 2: Apply the migration in Supabase**

Go to your Supabase project → SQL Editor → paste the contents of `supabase_migration_24_coach_program_submission.sql` → Run.

Expected: No errors. The `summer_programs` table now has `status`, `submitted_by`, `rejection_reason` columns.

- [ ] **Step 3: Verify existing programs are unaffected**

In Supabase SQL Editor:
```sql
SELECT id, name, status FROM summer_programs LIMIT 5;
```
Expected: All existing programs show `status = 'approved'`.

- [ ] **Step 4: Commit the migration file**

```bash
git add supabase_migration_24_coach_program_submission.sql
git commit -m "feat: add program status and submission columns to summer_programs"
```

---

### Task 2: `CoachProgramForm` component

**Files:**
- Create: `components/coach/CoachProgramForm.tsx`

This is the same form as `SchoolAdminProgramForm` but without the coach assignment section. It submits to `/api/coach/programs` (POST for create, PATCH for edit/resubmit).

- [ ] **Step 1: Create `components/coach/CoachProgramForm.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/admin/ImageUpload';

interface CoachProgramFormProps {
  mode: 'create' | 'edit';
  program?: {
    id: string;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    registration_deadline: string;
    cost: number;
    header_image_url?: string | null;
    program_image_url?: string | null;
  };
}

export default function CoachProgramForm({ mode, program }: CoachProgramFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(program?.name || '');
  const [description, setDescription] = useState(program?.description || '');
  const [startDate, setStartDate] = useState(
    program?.start_date ? program.start_date.split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    program?.end_date ? program.end_date.split('T')[0] : ''
  );
  const [deadline, setDeadline] = useState(
    program?.registration_deadline ? program.registration_deadline.split('T')[0] : ''
  );
  const [cost, setCost] = useState(program?.cost?.toString() || '');
  const [headerImageUrl, setHeaderImageUrl] = useState(program?.header_image_url || '');
  const [programImageUrl, setProgramImageUrl] = useState(program?.program_image_url || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = mode === 'create'
        ? '/api/coach/programs'
        : `/api/coach/programs/${program!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          start_date: startDate,
          end_date: endDate,
          registration_deadline: deadline,
          cost: parseFloat(cost),
          header_image_url: headerImageUrl || null,
          program_image_url: programImageUrl || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${mode} program`);

      router.push('/dashboard/coach');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Basketball Summer Camp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Describe the program..."
              />
            </div>
          </div>
        </div>

        {/* Dates & Cost */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Dates & Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Deadline *
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost (USD) *
              </label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="299.99"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header Image
              </label>
              <ImageUpload
                currentImageUrl={headerImageUrl}
                onUploadComplete={setHeaderImageUrl}
                folder="headers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Card Image
              </label>
              <ImageUpload
                currentImageUrl={programImageUrl}
                onUploadComplete={setProgramImageUrl}
                folder="programs"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-teal-500 text-white py-3 rounded-lg disabled:bg-gray-400 transition font-semibold hover:bg-teal-600"
          >
            {loading
              ? 'Submitting...'
              : mode === 'create'
              ? 'Submit for Approval'
              : 'Resubmit for Approval'}
          </button>
          <Link
            href="/dashboard/coach"
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition text-center font-semibold flex items-center justify-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/coach/CoachProgramForm.tsx
git commit -m "feat: add CoachProgramForm component"
```

---

### Task 3: Coach programs API routes

**Files:**
- Create: `app/api/coach/programs/route.ts`
- Create: `app/api/coach/programs/[id]/route.ts`

- [ ] **Step 1: Create `app/api/coach/programs/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const effectiveUserId = await getEffectiveUserId();

    const { data: coachData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!coachData || coachData.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!coachData.school_id) {
      return NextResponse.json({ error: 'No school assigned to your account' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      description,
      start_date,
      end_date,
      registration_deadline,
      cost,
      header_image_url,
      program_image_url,
    } = body;

    if (!name || !description || !start_date || !end_date || !registration_deadline || cost === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: program, error: programError } = await supabase
      .from('summer_programs')
      .insert({
        name,
        description,
        start_date,
        end_date,
        registration_deadline,
        cost: parseFloat(cost),
        header_image_url: header_image_url || null,
        program_image_url: program_image_url || null,
        school_id: coachData.school_id,
        status: 'pending',
        submitted_by: effectiveUserId,
        requirements: [],
      })
      .select()
      .single();

    if (programError) {
      console.error('Error creating program:', programError);
      return NextResponse.json({ error: programError.message }, { status: 400 });
    }

    // Add coach as primary coach in program_coaches
    await supabase.from('program_coaches').insert({
      program_id: program.id,
      coach_id: effectiveUserId,
      role: 'head',
    });

    return NextResponse.json({ program }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create program';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `app/api/coach/programs/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const effectiveUserId = await getEffectiveUserId();

    // Verify program ownership and editability
    const { data: program } = await supabase
      .from('summer_programs')
      .select('id, status, submitted_by')
      .eq('id', params.id)
      .single();

    if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (program.submitted_by !== effectiveUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!['pending', 'rejected'].includes(program.status)) {
      return NextResponse.json({ error: 'Cannot edit an approved program' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      description,
      start_date,
      end_date,
      registration_deadline,
      cost,
      header_image_url,
      program_image_url,
    } = body;

    const { data: updated, error } = await supabase
      .from('summer_programs')
      .update({
        name,
        description,
        start_date,
        end_date,
        registration_deadline,
        cost: parseFloat(cost),
        header_image_url: header_image_url || null,
        program_image_url: program_image_url || null,
        status: 'pending',
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ program: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update program';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/coach/programs/route.ts app/api/coach/programs/\[id\]/route.ts
git commit -m "feat: add coach program create and resubmit API routes"
```

---

### Task 4: Coach program pages (new + edit)

**Files:**
- Create: `app/dashboard/coach/programs/new/page.tsx`
- Create: `app/dashboard/coach/programs/[id]/edit/page.tsx`

- [ ] **Step 1: Create `app/dashboard/coach/programs/new/page.tsx`**

```tsx
import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CoachProgramForm from '@/components/coach/CoachProgramForm';

export default async function CoachNewProgramPage() {
  try {
    await requireRole('coach');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!userData?.school_id) {
      redirect('/dashboard/coach');
    }

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <a href="/dashboard/coach" className="text-teal-600 hover:text-teal-800">
              ← Back to Dashboard
            </a>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">Submit a New Program</h1>
            <p className="text-gray-500 mt-1">
              Your program will be reviewed by your school administrator before going live.
            </p>
          </div>
          <CoachProgramForm mode="create" />
        </div>
      </div>
    );
  } catch {
    redirect('/login');
  }
}
```

- [ ] **Step 2: Create `app/dashboard/coach/programs/[id]/edit/page.tsx`**

```tsx
import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CoachProgramForm from '@/components/coach/CoachProgramForm';

export default async function CoachEditProgramPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    await requireRole('coach');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    const { data: program } = await supabase
      .from('summer_programs')
      .select('*')
      .eq('id', params.id)
      .single();

    // Only allow editing if this coach submitted the program and it's pending/rejected
    if (
      !program ||
      program.submitted_by !== effectiveUserId ||
      !['pending', 'rejected'].includes(program.status)
    ) {
      redirect('/dashboard/coach');
    }

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <a href="/dashboard/coach" className="text-teal-600 hover:text-teal-800">
              ← Back to Dashboard
            </a>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">Edit & Resubmit Program</h1>
            {program.rejection_reason && (
              <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">Rejection reason:</p>
                <p className="text-sm text-red-700 mt-1">{program.rejection_reason}</p>
              </div>
            )}
          </div>
          <CoachProgramForm mode="edit" program={program} />
        </div>
      </div>
    );
  } catch {
    redirect('/login');
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add "app/dashboard/coach/programs/new/page.tsx" "app/dashboard/coach/programs/[id]/edit/page.tsx"
git commit -m "feat: add coach program new and edit pages"
```

---

### Task 5: Update coach dashboard and `CoachProgramsList`

**Files:**
- Modify: `app/dashboard/coach/page.tsx`
- Modify: `components/coach/CoachProgramsList.tsx`

The coach dashboard currently only shows programs the coach is assigned to via `program_coaches`. We need to also surface programs the coach submitted (which may be pending or rejected). We merge both lists by ID, and show status badges for pending/rejected programs.

- [ ] **Step 1: Update the programs query in `app/dashboard/coach/page.tsx`**

Replace the programs fetch block (lines that start with `// Fetch programs assigned to this coach`) with:

```typescript
    // Fetch programs assigned to this coach via program_coaches
    const { data: assignedData } = await supabase
      .from('program_coaches')
      .select(`
        program_id,
        summer_programs (
          id,
          name,
          description,
          start_date,
          end_date,
          registration_deadline,
          cost,
          header_image_url,
          status,
          rejection_reason,
          submitted_by
        )
      `)
      .eq('coach_id', effectiveUserId);

    // Fetch programs submitted by this coach (catches pending/rejected not yet in program_coaches visible set)
    const { data: submittedData } = await supabase
      .from('summer_programs')
      .select('id, name, description, start_date, end_date, registration_deadline, cost, header_image_url, status, rejection_reason, submitted_by')
      .eq('submitted_by', effectiveUserId);

    // Merge by ID — submitted version takes priority (has all status fields)
    const assignedPrograms = (assignedData?.map(pc => pc.summer_programs).filter(Boolean) || []) as any[];
    const submittedPrograms = submittedData || [];
    const submittedIds = new Set(submittedPrograms.map((p: any) => p.id));
    const mergedPrograms = [
      ...submittedPrograms,
      ...assignedPrograms.filter((p: any) => !submittedIds.has(p.id)),
    ];
```

Then replace `const programs = programsData?.map(...)...` with:
```typescript
    const programs = mergedPrograms;
```

Also add a "+ Submit Program" button to the "Your Programs" section header. Replace:
```tsx
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Your Programs</h2>
            <span className="text-sm text-slate-500">
              {programs.length} {programs.length === 1 ? 'program' : 'programs'} assigned
            </span>
          </div>
```
with:
```tsx
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Your Programs</h2>
            <a
              href="/dashboard/coach/programs/new"
              className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
            >
              + Submit Program
            </a>
          </div>
```

- [ ] **Step 2: Update `components/coach/CoachProgramsList.tsx`**

Replace the entire file with the following (adds approval status badges and resubmit button, preserves all existing functionality):

```tsx
'use client';

import { ClipboardDocumentListIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  cost: number;
  header_image_url?: string;
  status?: string;
  rejection_reason?: string | null;
  submitted_by?: string | null;
}

interface CoachProgramsListProps {
  programs: Program[];
}

export default function CoachProgramsList({ programs }: CoachProgramsListProps) {
  if (!programs || programs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-card">
        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <ClipboardDocumentListIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Programs Yet</h3>
        <p className="text-sm text-slate-500">
          You have no programs assigned or submitted. Use the button above to submit a new program.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimelineBadge = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now >= start && now <= end) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
          Active
        </span>
      );
    } else if (now < start) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
          Upcoming
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
        Completed
      </span>
    );
  };

  const getApprovalBadge = (status?: string) => {
    if (!status || status === 'approved') return null;
    if (status === 'pending') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
          Awaiting Approval
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
          Not Approved
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {programs.map((program) => {
        const isPendingOrRejected = program.status === 'pending' || program.status === 'rejected';
        return (
          <div
            key={program.id}
            className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {program.header_image_url && (
                <img
                  src={program.header_image_url}
                  alt={program.name}
                  className="w-full lg:w-40 h-32 object-cover rounded-lg flex-shrink-0"
                />
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-lg font-semibold text-slate-900">{program.name}</h3>
                      {getApprovalBadge(program.status)}
                      {!isPendingOrRejected && getTimelineBadge(program.start_date, program.end_date)}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">
                      {program.description || 'No description available'}
                    </p>
                  </div>
                </div>

                {program.status === 'rejected' && program.rejection_reason && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-medium text-red-800">Rejection reason:</p>
                    <p className="text-sm text-red-700 mt-0.5">{program.rejection_reason}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate(program.start_date)} - {formatDate(program.end_date)}</span>
                  </div>
                  <div className="font-medium text-slate-900">
                    ${Number(program.cost).toFixed(0)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {!isPendingOrRejected && (
                    <a
                      href={`/programs/${program.id}`}
                      className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
                    >
                      View Details
                    </a>
                  )}
                  {program.status === 'rejected' && (
                    <a
                      href={`/dashboard/coach/programs/${program.id}/edit`}
                      className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
                    >
                      Edit & Resubmit
                    </a>
                  )}
                  {program.status === 'pending' && (
                    <span className="px-4 py-2 bg-slate-100 text-slate-500 text-sm font-medium rounded-lg">
                      Pending Review
                    </span>
                  )}
                  {!isPendingOrRejected && (
                    <a
                      href={`/dashboard/coach/programs/${program.id}/edit`}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Edit Program
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/coach/page.tsx components/coach/CoachProgramsList.tsx
git commit -m "feat: show submitted programs with status badges on coach dashboard"
```

---

### Task 6: School admin approve/reject API routes

**Files:**
- Create: `app/api/school-admin/programs/[id]/approve/route.ts`
- Create: `app/api/school-admin/programs/[id]/reject/route.ts`

Note: `RESEND_FROM_EMAIL` env var should be set to your verified sender address (e.g. `noreply@pjmetzger.com`). The routes fall back to `noreply@schoolsports.com` if unset.

- [ ] **Step 1: Create `app/api/school-admin/programs/[id]/approve/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';
import { resend } from '@/lib/resend';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const effectiveUserId = await getEffectiveUserId();

    const { data: adminData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!adminData || adminData.role !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: program } = await supabase
      .from('summer_programs')
      .select('id, name, school_id, status, submitted_by')
      .eq('id', params.id)
      .single();

    if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (program.school_id !== adminData.school_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (program.status !== 'pending') {
      return NextResponse.json({ error: 'Program is not pending' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('summer_programs')
      .update({ status: 'approved', rejection_reason: null })
      .eq('id', params.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    // Email the submitting coach
    if (program.submitted_by) {
      const { data: coachData } = await supabase
        .from('users')
        .select('email, first_name')
        .eq('id', program.submitted_by)
        .single();

      if (coachData?.email) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@schoolsports.com',
          to: coachData.email,
          subject: `Your program "${program.name}" has been approved`,
          html: `
            <p>Hi ${coachData.first_name || 'Coach'},</p>
            <p>Great news! Your program <strong>${program.name}</strong> has been approved by your school administrator.</p>
            <p>The program is now live and open for registrations.</p>
            <p>Thank you,<br/>SchoolSports</p>
          `,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to approve program';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `app/api/school-admin/programs/[id]/reject/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';
import { resend } from '@/lib/resend';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const effectiveUserId = await getEffectiveUserId();

    const { data: adminData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!adminData || adminData.role !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const reason: string | undefined = body.reason;

    const { data: program } = await supabase
      .from('summer_programs')
      .select('id, name, school_id, status, submitted_by')
      .eq('id', params.id)
      .single();

    if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (program.school_id !== adminData.school_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (program.status !== 'pending') {
      return NextResponse.json({ error: 'Program is not pending' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('summer_programs')
      .update({ status: 'rejected', rejection_reason: reason || null })
      .eq('id', params.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    if (program.submitted_by) {
      const { data: coachData } = await supabase
        .from('users')
        .select('email, first_name')
        .eq('id', program.submitted_by)
        .single();

      if (coachData?.email) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@schoolsports.com',
          to: coachData.email,
          subject: `Your program "${program.name}" was not approved`,
          html: `
            <p>Hi ${coachData.first_name || 'Coach'},</p>
            <p>Unfortunately, your program <strong>${program.name}</strong> was not approved by your school administrator.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>You can edit and resubmit your program for review from your dashboard.</p>
            <p>Thank you,<br/>SchoolSports</p>
          `,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reject program';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add "app/api/school-admin/programs/[id]/approve/route.ts" "app/api/school-admin/programs/[id]/reject/route.ts"
git commit -m "feat: add school admin program approve and reject API routes"
```

---

### Task 7: `PendingProgramsList` component

**Files:**
- Create: `components/school-admin/PendingProgramsList.tsx`

This is a client component. It lists pending programs with Approve and Reject actions. Reject opens an inline reason input before confirming.

- [ ] **Step 1: Create `components/school-admin/PendingProgramsList.tsx`**

```tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface PendingProgram {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  cost: number;
  submitted_by_name: string;
  created_at: string;
}

interface PendingProgramsListProps {
  programs: PendingProgram[];
}

export default function PendingProgramsList({ programs }: PendingProgramsListProps) {
  const router = useRouter();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  if (programs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-card p-8 text-center">
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <ClipboardDocumentListIcon className="w-6 h-6 text-green-500" />
        </div>
        <p className="text-gray-500 text-sm">No pending program submissions.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const handleApprove = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/school-admin/programs/${id}/approve`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to approve program');
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/school-admin/programs/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to reject program');
        return;
      }
      setRejectingId(null);
      setRejectReason('');
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Program
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Coach
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Dates
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Cost
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {programs.map((program) => (
            <React.Fragment key={program.id}>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{program.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted {formatDate(program.created_at)}
                  </p>
                </td>
                <td className="px-6 py-4 text-gray-600">{program.submitted_by_name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span>
                      {formatDate(program.start_date)} – {formatDate(program.end_date)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  ${Number(program.cost).toFixed(0)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleApprove(program.id)}
                      disabled={loading === program.id}
                      className="px-3 py-1.5 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors"
                    >
                      {loading === program.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(program.id);
                        setRejectReason('');
                      }}
                      disabled={loading === program.id}
                      className="px-3 py-1.5 bg-white border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
              {rejectingId === program.id && (
                <tr className="bg-red-50">
                  <td colSpan={5} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-red-800 mb-1">
                          Rejection reason (optional)
                        </label>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. Dates conflict with existing program"
                          className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2 pt-6">
                        <button
                          onClick={() => handleReject(program.id)}
                          disabled={loading === program.id}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {loading === program.id ? '...' : 'Confirm Reject'}
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/school-admin/PendingProgramsList.tsx
git commit -m "feat: add PendingProgramsList component for school admin"
```

---

### Task 8: Update school admin pending approvals page

**Files:**
- Modify: `app/school-admin/pending-approvals/page.tsx`

Add a Pending Programs section above the existing assistant coaches section. Query `summer_programs` for `status = 'pending'` in the admin's school, join with the submitting coach's name.

- [ ] **Step 1: Update `app/school-admin/pending-approvals/page.tsx`**

Replace the entire file with:

```tsx
import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PendingApprovalsList from '@/components/school-admin/PendingApprovalsList';
import PendingProgramsList from '@/components/school-admin/PendingProgramsList';

export default async function PendingApprovalsPage() {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    const { data: adminData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!adminData?.school_id) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No school assigned to your account.</p>
        </div>
      );
    }

    // Fetch pending assistant coaches
    const { data: pendingAssistants, error: assistantError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, approval_status, created_at')
      .eq('school_id', adminData.school_id)
      .eq('role', 'assistant_coach')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (assistantError) {
      console.error('Error fetching pending assistants:', assistantError);
    }

    const assistantsWithDetails = await Promise.all(
      (pendingAssistants || []).map(async (assistant) => {
        const [certResult, coachResult] = await Promise.all([
          supabase
            .from('coach_certifications')
            .select('*', { count: 'exact', head: true })
            .eq('coach_id', assistant.id),
          supabase
            .from('coach_assistants')
            .select('coach:coach_id(first_name, last_name)')
            .eq('assistant_id', assistant.id)
            .single(),
        ]);

        const coach = coachResult.data?.coach;
        const coachObj = Array.isArray(coach) ? coach[0] : coach;

        return {
          ...assistant,
          certification_count: certResult.count || 0,
          invited_by: coachObj
            ? `${coachObj.first_name || ''} ${coachObj.last_name || ''}`.trim()
            : null,
        };
      })
    );

    // Fetch pending programs for this school
    const { data: pendingPrograms, error: programError } = await supabase
      .from('summer_programs')
      .select('id, name, start_date, end_date, cost, submitted_by, created_at')
      .eq('school_id', adminData.school_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (programError) {
      console.error('Error fetching pending programs:', programError);
    }

    // Enrich programs with coach name
    const programsWithCoach = await Promise.all(
      (pendingPrograms || []).map(async (program) => {
        if (!program.submitted_by) {
          return { ...program, submitted_by_name: 'Unknown' };
        }
        const { data: coachData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', program.submitted_by)
          .single();

        return {
          ...program,
          submitted_by_name: coachData
            ? `${coachData.first_name || ''} ${coachData.last_name || ''}`.trim()
            : 'Unknown',
        };
      })
    );

    const totalPending = assistantsWithDetails.length + programsWithCoach.length;

    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-600 mt-1">
            Review and approve program submissions and assistant coach applications
          </p>
        </div>

        {/* Stats */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-800">
                {totalPending} Pending Approval{totalPending !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-amber-700">
                {programsWithCoach.length} program{programsWithCoach.length !== 1 ? 's' : ''},{' '}
                {assistantsWithDetails.length} assistant coach{assistantsWithDetails.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Programs */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Program Submissions
          </h2>
          <PendingProgramsList programs={programsWithCoach} />
        </div>

        {/* Pending Assistant Coaches */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Assistant Coach Applications
          </h2>
          <PendingApprovalsList pendingAssistants={assistantsWithDetails} />
        </div>
      </div>
    );
  } catch {
    redirect('/login');
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Start dev server and verify the pending approvals page loads**

```bash
npm run dev
```

Navigate to `http://localhost:3000/school-admin/pending-approvals` as a school admin. Expected:
- Page loads without errors
- "Program Submissions" section visible (empty if no pending programs)
- "Assistant Coach Applications" section visible as before

- [ ] **Step 4: End-to-end test**

1. Sign in as a coach → go to dashboard → click "+ Submit Program" → fill in all fields → click "Submit for Approval"
2. Expected: redirected to dashboard, program shows with "Awaiting Approval" amber badge
3. Sign in as the school admin → go to Pending Approvals → see the program in "Program Submissions"
4. Click Approve → Expected: program disappears from pending list, coach's dashboard shows program without pending badge
5. Repeat steps 1-3 with a second program → click Reject → enter a reason → click Confirm Reject
6. Expected: program disappears from pending list; coach's dashboard shows "Not Approved" badge with rejection reason and "Edit & Resubmit" button
7. Coach clicks "Edit & Resubmit" → edits form → submits → program reappears in admin's pending list

- [ ] **Step 5: Commit**

```bash
git add app/school-admin/pending-approvals/page.tsx
git commit -m "feat: add pending program submissions to school admin approvals page"
```
