import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generateCSSVariables } from '@/lib/colorPalette';
import Sidebar from '@/components/layout/Sidebar';
import CoachProgramEditForm from '@/components/coach/CoachProgramEditForm';
import '../../../../school-styles.css';

export default async function CoachEditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('coach');
    const supabase = await createClient();

    const { id } = await params;

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      redirect('/login');
    }

    // Fetch coach's school information
    const { data: userData } = await supabase
      .from('users')
      .select(`
        email,
        first_name,
        school:school_id (
          id,
          name,
          logo_url,
          primary_color,
          secondary_color
        )
      `)
      .eq('id', effectiveUserId)
      .single();

    // Fetch the program and verify coach has access
    // Coach can edit if: they created it OR they're assigned to it
    const { data: program, error } = await supabase
      .from('summer_programs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !program) {
      redirect('/dashboard/coach');
    }

    // Check if coach is assigned to this program or created it
    const { data: assignment } = await supabase
      .from('program_coaches')
      .select('id')
      .eq('program_id', id)
      .eq('coach_id', effectiveUserId)
      .single();

    const isCreator = program.created_by === effectiveUserId;
    const isAssigned = !!assignment;

    if (!isCreator && !isAssigned) {
      redirect('/dashboard/coach');
    }

    // Use school colors or defaults
    const school = Array.isArray(userData?.school) ? userData.school[0] : userData?.school;
    const primaryColor = school?.primary_color || '#3b82f6';
    const secondaryColor = school?.secondary_color || '#60a5fa';
    const cssVariables = generateCSSVariables(primaryColor, secondaryColor);

    const navItems = [
      { name: 'Dashboard', icon: 'Calendar' as const, href: '/dashboard/coach' },
      { name: 'Attendance', icon: 'UserGroup' as const, href: '/dashboard/coach/attendance' },
      { name: 'Schedule', icon: 'Calendar' as const, href: '#schedule' },
      { name: 'Messages', icon: 'ChatBubble' as const, href: '#messages' },
    ];

    return (
      <div className="flex h-screen bg-gray-50">
        <style dangerouslySetInnerHTML={{
          __html: `:root { ${cssVariables} }`
        }} />

        {/* Sidebar */}
        <Sidebar
          items={navItems}
          userEmail={userData?.email}
          schoolName={school?.name}
          schoolLogo={school?.logo_url}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 h-16 flex items-center px-8 school-branded-topbar">
            <div className="flex items-center gap-3">
              <a
                href="/dashboard/coach"
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Dashboard
              </a>
              {school?.logo_url && (
                <img
                  src={school.logo_url}
                  alt={school.name}
                  className="h-8 w-auto"
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Edit Program</h1>
                {school?.name && (
                  <p className="text-xs text-gray-500">{school.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <main className="p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {program.name}
                </h2>
                <p className="text-gray-600">
                  Update program details and settings
                </p>
              </div>

              <CoachProgramEditForm program={program} coachId={effectiveUserId} />
            </div>
          </main>
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
