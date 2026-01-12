import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generateCSSVariables } from '@/lib/colorPalette';
import Sidebar from '@/components/layout/Sidebar';
import '../school-styles.css';

export default async function StudentDashboard() {
  try {
    await requireRole('student');
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    // Fetch student's school information (if they have a school assigned)
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
    const primaryColor = userData?.school?.primary_color || '#3b82f6';
    const secondaryColor = userData?.school?.secondary_color || '#60a5fa';
    const cssVariables = generateCSSVariables(primaryColor, secondaryColor);

    const navItems = [
      { name: 'My Programs', icon: 'Calendar' as const, href: '#programs' },
      { name: 'My Schedule', icon: 'Calendar' as const, href: '#schedule' },
      { name: 'Performance', icon: 'UserGroup' as const, href: '#performance' },
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
          schoolName={userData?.school?.name}
          schoolLogo={userData?.school?.logo_url}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 h-16 flex items-center px-8 school-branded-topbar">
            <div className="flex items-center gap-3">
              {userData?.school?.logo_url && (
                <img
                  src={userData.school.logo_url}
                  alt={userData.school.name}
                  className="h-8 w-auto"
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Student Dashboard</h1>
                {userData?.school?.name && (
                  <p className="text-xs text-gray-500">{userData.school.name}</p>
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
                View your sports teams, schedules, and performance.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6 school-branded-card hover:shadow-lg transition">
                <h3 className="font-semibold text-lg mb-2 text-gray-800">My Programs</h3>
                <p className="text-gray-600 text-sm">View your enrolled sports programs</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 school-branded-card hover:shadow-lg transition">
                <h3 className="font-semibold text-lg mb-2 text-gray-800">Schedule</h3>
                <p className="text-gray-600 text-sm">Check your practice and game schedules</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 school-branded-card hover:shadow-lg transition">
                <h3 className="font-semibold text-lg mb-2 text-gray-800">Performance</h3>
                <p className="text-gray-600 text-sm">Track your athletic performance</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 school-branded-card hover:shadow-lg transition">
                <h3 className="font-semibold text-lg mb-2 text-gray-800">Messages</h3>
                <p className="text-gray-600 text-sm">Communicate with coaches</p>
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
