import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SchoolAdminDashboard() {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    // Get school admin's school information
    const { data: userData } = await supabase
      .from('users')
      .select(`
        *,
        school:school_id (
          id,
          name,
          city,
          state,
          address,
          phone,
          email
        )
      `)
      .eq('id', effectiveUserId)
      .single();

    if (!userData?.school) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow p-6 max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-2">No School Assigned</h2>
            <p className="text-gray-600">
              Your account is not assigned to a school. Please contact an administrator.
            </p>
          </div>
        </div>
      );
    }

    // Get counts for dashboard cards
    const [coachesCount, parentsCount, programsCount, communicationsCount] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true })
        .eq('role', 'coach').eq('school_id', userData.school.id),
      supabase.from('users').select('*', { count: 'exact', head: true })
        .eq('role', 'parent').eq('school_id', userData.school.id),
      supabase.from('summer_programs').select('*', { count: 'exact', head: true })
        .eq('school_id', userData.school.id),
      supabase.from('communications').select('*', { count: 'exact', head: true })
        .eq('school_id', userData.school.id),
    ]);

    return (
      <div className="p-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome, {userData.first_name}!
          </h1>
          <p className="text-gray-600 mb-4">
            Manage {userData.school.name} from this dashboard.
          </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {userData.school.address && (
                <div>
                  <span className="font-medium text-gray-700">Address:</span>
                  <p className="text-gray-600">
                    {userData.school.address}
                    {userData.school.city && userData.school.state && (
                      <>
                        <br />
                        {userData.school.city}, {userData.school.state}
                      </>
                    )}
                  </p>
                </div>
              )}
              {userData.school.phone && (
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <p className="text-gray-600">{userData.school.phone}</p>
                </div>
              )}
              {userData.school.email && (
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-600">{userData.school.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Coaches</p>
                  <p className="text-3xl font-bold text-gray-800">{coachesCount.count || 0}</p>
                </div>
                <div className="text-4xl">👨‍🏫</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Parents</p>
                  <p className="text-3xl font-bold text-gray-800">{parentsCount.count || 0}</p>
                </div>
                <div className="text-4xl">👨‍👩‍👧</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Programs</p>
                  <p className="text-3xl font-bold text-gray-800">{programsCount.count || 0}</p>
                </div>
                <div className="text-4xl">🏃</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Communications</p>
                  <p className="text-3xl font-bold text-gray-800">{communicationsCount.count || 0}</p>
                </div>
                <div className="text-4xl">📧</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            <a href="/school-admin/users/new" className="school-btn-primary rounded-lg p-6 block">
              <h3 className="font-semibold text-lg mb-2">+ Add User</h3>
              <p className="text-sm opacity-90">Create a new coach, parent, or school admin</p>
            </a>
            <a href="/school-admin/programs/new" className="school-btn-secondary rounded-lg p-6 block">
              <h3 className="font-semibold text-lg mb-2">+ Create Program</h3>
              <p className="text-sm opacity-90">Add a new summer program</p>
            </a>
            <a href="/school-admin/communications/send" className="school-btn-primary rounded-lg p-6 block">
              <h3 className="font-semibold text-lg mb-2">📤 Send Message</h3>
              <p className="text-sm opacity-90">Communicate with coaches and parents</p>
            </a>
          </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
