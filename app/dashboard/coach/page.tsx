import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generateCSSVariables } from '@/lib/colorPalette';
import Sidebar from '@/components/layout/Sidebar';
import CoachProgramsList from '@/components/coach/CoachProgramsList';
import '../school-styles.css';

export default async function CoachDashboard() {
  try {
    await requireRole('coach');
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

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

    // Fetch programs assigned to this coach
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
          registration_deadline,
          cost,
          header_image_url
        )
      `)
      .eq('coach_id', effectiveUserId);

    // Extract the programs from the nested structure
    const programs = programsData?.map(pc => pc.summer_programs).filter(Boolean) || [];

    // Calculate program stats
    const now = new Date();
    const activePrograms = programs.filter((p: any) => {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      return now >= start && now <= end;
    }).length;

    const upcomingPrograms = programs.filter((p: any) => {
      const start = new Date(p.start_date);
      return now < start;
    }).length;

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
              {school?.logo_url && (
                <img
                  src={school.logo_url}
                  alt={school.name}
                  className="h-8 w-auto"
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Coach Dashboard</h1>
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
                Welcome back{userData?.first_name ? `, ${userData.first_name}` : ''}
              </h2>
              <p className="text-lg text-gray-600">
                Manage your programs, schedules, and communicate with players and parents.
              </p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 school-branded-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Programs</p>
                    <p className="text-3xl font-bold text-gray-900">{programs.length}</p>
                  </div>
                  <div className="text-4xl">📋</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 school-branded-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Programs</p>
                    <p className="text-3xl font-bold text-green-600">{activePrograms}</p>
                  </div>
                  <div className="text-4xl">✅</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 school-branded-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Upcoming Programs</p>
                    <p className="text-3xl font-bold text-blue-600">{upcomingPrograms}</p>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
              </div>
            </div>

            {/* My Programs Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">My Programs</h3>
                <span className="text-sm text-gray-500">
                  {programs.length} {programs.length === 1 ? 'program' : 'programs'} assigned
                </span>
              </div>
              <CoachProgramsList programs={programs as any} />
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a
                  href="/dashboard/coach/attendance"
                  className="bg-white rounded-lg shadow p-6 school-branded-card hover:shadow-lg transition block"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">✓</span>
                    <h4 className="font-semibold text-lg text-gray-800">Take Attendance</h4>
                  </div>
                  <p className="text-gray-600 text-sm">Mark daily attendance for active programs</p>
                </a>

                <div className="bg-white rounded-lg shadow p-6 school-branded-card hover:shadow-lg transition cursor-pointer opacity-60">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">👥</span>
                    <h4 className="font-semibold text-lg text-gray-800">Athletes</h4>
                  </div>
                  <p className="text-gray-600 text-sm">Manage athlete rosters and information</p>
                  <span className="text-xs text-gray-400 mt-2 block">Coming soon</span>
                </div>

                <div className="bg-white rounded-lg shadow p-6 school-branded-card hover:shadow-lg transition cursor-pointer opacity-60">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📅</span>
                    <h4 className="font-semibold text-lg text-gray-800">Schedule</h4>
                  </div>
                  <p className="text-gray-600 text-sm">Create and manage practice schedules</p>
                  <span className="text-xs text-gray-400 mt-2 block">Coming soon</span>
                </div>

                <div className="bg-white rounded-lg shadow p-6 school-branded-card hover:shadow-lg transition cursor-pointer opacity-60">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">💬</span>
                    <h4 className="font-semibold text-lg text-gray-800">Communication</h4>
                  </div>
                  <p className="text-gray-600 text-sm">Message athletes and parents</p>
                  <span className="text-xs text-gray-400 mt-2 block">Coming soon</span>
                </div>

                <div className="bg-white rounded-lg shadow p-6 school-branded-card hover:shadow-lg transition cursor-pointer opacity-60">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📊</span>
                    <h4 className="font-semibold text-lg text-gray-800">Reports</h4>
                  </div>
                  <p className="text-gray-600 text-sm">Generate program and athlete reports</p>
                  <span className="text-xs text-gray-400 mt-2 block">Coming soon</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
