import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: programId } = await params;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ children: [] });
    }

    // Fetch registrations for this program where the parent is the current user
    const { data: registrations, error } = await supabase
      .from('program_registrations')
      .select('id, student_name, student_id')
      .eq('program_id', programId)
      .eq('parent_user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ children: registrations || [] });
  } catch (error: any) {
    console.error('Error fetching registered children:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registered children' },
      { status: 500 }
    );
  }
}
