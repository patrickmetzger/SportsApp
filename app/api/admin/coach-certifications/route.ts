import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List all coach certifications with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // valid, expiring, expired
    const schoolId = searchParams.get('school_id');
    const certTypeId = searchParams.get('certification_type_id');

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
      .order('created_at', { ascending: false });

    if (certTypeId) {
      query = query.eq('certification_type_id', certTypeId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Apply status filter in memory (since it's calculated)
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

    // Apply school filter if specified
    if (schoolId) {
      filteredData = filteredData.filter((cert) => {
        const school = Array.isArray(cert.coach?.school) ? cert.coach.school[0] : cert.coach?.school;
        return school?.id === schoolId;
      });
    }

    return NextResponse.json({ certifications: filteredData });
  } catch (error: unknown) {
    console.error('Error fetching certifications:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch certifications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
