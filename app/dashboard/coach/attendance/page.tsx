import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generateCSSVariables } from '@/lib/colorPalette';
import Sidebar from '@/components/layout/Sidebar';
import CoachAttendanceList from '@/components/coach/CoachAttendanceList';
import '../../school-styles.css';

export default async function CoachAttendancePage() {
  try {
    await requireRole('coach');
    const supabase = await createClient();

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

    // Fetch active programs assigned to this coach
    const today = new Date().toISOString().split('T')[0];
    const { data: programsData } = await supabase
      .from('program_coaches')
      .select(`
        program_id,
        summer_programs (
          id,
          name,
          description,
          start_date,
          end_date,
          cost
        )
      `)
      .eq('coach_id', effectiveUserId);

    // Extract programs and filter for active ones
    const allPrograms = programsData?.map(pc => pc.summer_programs).filter(Boolean) || [];
    const activePrograms = allPrograms.filter((p: any) => {
      return p.start_date <= today && p.end_date >= today;
    });

    // For each active program, get registration count
    const programsWithCounts = await Promise.all(
      activePrograms.map(async (program: any) => {
        const { count } = await supabase
          .from('program_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('program_id', program.id);

        return {
          ...program,
          student_count: count || 0
        };
      })
    );

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
              {school?.logo_url && (
                <img
                  src={school.logo_url}
                  alt={school.name}
                  className="h-8 w-auto"
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Attendance Management</h1>
                {school?.name && (
                  <p className="text-xs text-gray-500">{school.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <main className="p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Daily Attendance
              </h2>
              <p className="text-lg text-gray-600">
                Track attendance for your active programs. Click on a program to take or view attendance.
              </p>
            </div>

            {/* Active Programs Section */}
            <CoachAttendanceList programs={programsWithCounts} coachId={effectiveUserId} />
          </main>
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
