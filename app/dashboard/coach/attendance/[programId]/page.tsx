import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generateCSSVariables } from '@/lib/colorPalette';
import Sidebar from '@/components/layout/Sidebar';
import TakeAttendanceForm from '@/components/coach/TakeAttendanceForm';
import '../../../school-styles.css';

export default async function TakeAttendancePage({ params }: { params: Promise<{ programId: string }> }) {
  try {
    await requireRole('coach');
    const supabase = await createClient();

    const { programId } = await params;

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      redirect('/login');
    }

    // Verify coach is assigned to this program
    const { data: coachAssignment } = await supabase
      .from('program_coaches')
      .select('id')
      .eq('coach_id', effectiveUserId)
      .eq('program_id', programId)
      .single();

    if (!coachAssignment) {
      redirect('/dashboard/coach/attendance');
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

    // Fetch program details
    const { data: program } = await supabase
      .from('summer_programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (!program) {
      redirect('/dashboard/coach/attendance');
    }

    // Fetch program registrations (students)
    const { data: registrations } = await supabase
      .from('program_registrations')
      .select('*')
      .eq('program_id', programId)
      .order('student_name');

    // Fetch today's attendance if already recorded
    const today = new Date().toISOString().split('T')[0];
    const { data: existingAttendance } = await supabase
      .from('program_attendance')
      .select('*')
      .eq('program_id', programId)
      .eq('attendance_date', today);

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
                href="/dashboard/coach/attendance"
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Attendance
              </a>
              {school?.logo_url && (
                <img
                  src={school.logo_url}
                  alt={school.name}
                  className="h-8 w-auto"
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Take Attendance</h1>
                {school?.name && (
                  <p className="text-xs text-gray-500">{school.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <main className="p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {program.name}
              </h2>
              <p className="text-gray-600">
                {program.description || 'Mark attendance for today\'s session'}
              </p>
            </div>

            <TakeAttendanceForm
              programId={programId}
              coachId={effectiveUserId}
              students={registrations || []}
              existingAttendance={existingAttendance || []}
              today={today}
            />
          </main>
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
