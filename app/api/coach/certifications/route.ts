import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

// GET - List coach's certifications
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', effectiveUserId)
      .single();

    if (!userData || (userData.role !== 'coach' && userData.role !== 'assistant_coach')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('coach_certifications')
      .select(`
        *,
        certification_type:certification_types(*)
      `)
      .eq('coach_id', effectiveUserId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ certifications: data });
  } catch (error: unknown) {
    console.error('Error fetching certifications:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch certifications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Create a new certification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', effectiveUserId)
      .single();

    if (!userData || (userData.role !== 'coach' && userData.role !== 'assistant_coach')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      certification_type_id,
      certificate_number,
      issuing_organization,
      issue_date,
      expiration_date,
      document_url,
      document_original_name,
      ocr_extracted_data,
    } = body;

    if (!certification_type_id) {
      return NextResponse.json({ error: 'Certification type is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('coach_certifications')
      .insert({
        coach_id: effectiveUserId,
        certification_type_id,
        certificate_number: certificate_number || null,
        issuing_organization: issuing_organization || null,
        issue_date: issue_date || null,
        expiration_date: expiration_date || null,
        document_url: document_url || null,
        document_original_name: document_original_name || null,
        ocr_extracted_data: ocr_extracted_data || {},
      })
      .select(`
        *,
        certification_type:certification_types(*)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, certification: data });
  } catch (error: unknown) {
    console.error('Error creating certification:', error);
    const message = error instanceof Error ? error.message : 'Failed to create certification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
