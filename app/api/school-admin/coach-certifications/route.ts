import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List coach certifications for this school
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!userData.school_id) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const certTypeId = searchParams.get('certification_type_id');

    // Get coaches from this school first
    const { data: schoolCoaches } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'coach')
      .eq('school_id', userData.school_id);

    const coachIds = (schoolCoaches || []).map(c => c.id);

    if (coachIds.length === 0) {
      return NextResponse.json({ certifications: [] });
    }

    // Build query
    let query = supabase
      .from('coach_certifications')
      .select(`
        *,
        certification_type:certification_types(*),
        coach:users!coach_certifications_coach_id_fkey(
          id, email, first_name, last_name,
          school:schools(id, name)
        )
      `)
      .in('coach_id', coachIds)
      .order('created_at', { ascending: false });

    if (certTypeId) {
      query = query.eq('certification_type_id', certTypeId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Apply status filter in memory
    let filteredData = data || [];

    if (status) {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      filteredData = filteredData.filter((cert) => {
        if (!cert.expiration_date) return status === 'valid';
        const expDate = new Date(cert.expiration_date);

        if (status === 'expired') return expDate < now;
        if (status === 'expiring') return expDate >= now && expDate <= thirtyDaysFromNow;
        if (status === 'valid') return expDate > thirtyDaysFromNow;
        return true;
      });
    }

    return NextResponse.json({ certifications: filteredData });
  } catch (error: unknown) {
    console.error('Error fetching certifications:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch certifications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
