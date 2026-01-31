import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

// GET - Get a single certification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();

    const { data, error } = await supabase
      .from('coach_certifications')
      .select(`
        *,
        certification_type:certification_types(*)
      `)
      .eq('id', id)
      .eq('coach_id', effectiveUserId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    return NextResponse.json({ certification: data });
  } catch (error: unknown) {
    console.error('Error fetching certification:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch certification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT - Update a certification
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();

    // Verify ownership
    const { data: existing } = await supabase
      .from('coach_certifications')
      .select('id')
      .eq('id', id)
      .eq('coach_id', effectiveUserId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      certificate_number,
      issuing_organization,
      issue_date,
      expiration_date,
      document_url,
      document_original_name,
    } = body;

    const { data, error } = await supabase
      .from('coach_certifications')
      .update({
        certificate_number: certificate_number || null,
        issuing_organization: issuing_organization || null,
        issue_date: issue_date || null,
        expiration_date: expiration_date || null,
        document_url: document_url || null,
        document_original_name: document_original_name || null,
      })
      .eq('id', id)
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
    console.error('Error updating certification:', error);
    const message = error instanceof Error ? error.message : 'Failed to update certification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Delete a certification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();

    // Verify ownership
    const { data: existing } = await supabase
      .from('coach_certifications')
      .select('id, document_url')
      .eq('id', id)
      .eq('coach_id', effectiveUserId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    // Delete from database
    const { error } = await supabase
      .from('coach_certifications')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Note: Storage file should be deleted separately if needed
    // The document_url contains a signed URL, so we'd need to parse out the path

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting certification:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete certification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
