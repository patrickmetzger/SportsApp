import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveUserId, getUserRole } from '@/lib/auth';

async function getCoachSchoolId(): Promise<{ effectiveUserId: string; school_id: string | null } | null> {
  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) return null;

  const role = await getUserRole();
  if (role !== 'coach') return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', effectiveUserId)
    .single();

  return { effectiveUserId, school_id: data?.school_id ?? null };
}

// GET - List certification types available to the coach (global + school-specific)
export async function GET() {
  try {
    const coach = await getCoachSchoolId();
    if (!coach) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();

    // Get global certification types (school_id is null) and school-specific types
    let query = supabase
      .from('certification_types')
      .select('*')
      .order('name');

    if (coach.school_id) {
      query = query.or(`school_id.is.null,school_id.eq.${coach.school_id}`);
    } else {
      query = query.is('school_id', null);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ certificationTypes: data });
  } catch (error: unknown) {
    console.error('Error fetching certification types:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch certification types';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Coach creates a new school-specific certification type
export async function POST(request: NextRequest) {
  try {
    const coach = await getCoachSchoolId();
    if (!coach) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!coach.school_id) {
      return NextResponse.json({ error: 'You must be assigned to a school to create certification types' }, { status: 400 });
    }

    const { name, description } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Use admin client — RLS only allows admins/school_admins to insert certification_types
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('certification_types')
      .insert({ name: name.trim(), description: description?.trim() || null, school_id: coach.school_id })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ certificationTypes: data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create certification type';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
