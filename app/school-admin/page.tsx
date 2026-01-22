import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  UsersIcon,
  UserGroupIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

export default async function SchoolAdminDashboard() {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();

    const effectiveUserId = await getEffectiveUserId();

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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-xl shadow-card p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BuildingOfficeIcon className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No School Assigned</h2>
            <p className="text-slate-500">
              Your account is not assigned to a school. Please contact an administrator.
            </p>
          </div>
        </div>
      );
    }

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

    const school = Array.isArray(userData.school) ? userData.school[0] : userData.school;

    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{school.name}</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {userData.first_name}. Manage your institution.
          </p>
        </div>

        {/* School Info Card */}
        {(school.address || school.phone || school.email) && (
          <div className="bg-white rounded-xl p-6 shadow-card">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">School Information</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {school.address && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Location</p>
                    <p className="text-sm font-medium text-slate-900">
                      {school.address}
                      {school.city && school.state && (
                        <span className="block">{school.city}, {school.state}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              {school.phone && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PhoneIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Phone</p>
                    <p className="text-sm font-medium text-slate-900">{school.phone}</p>
                  </div>
                </div>
              )}
              {school.email && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <EnvelopeIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Email</p>
                    <p className="text-sm font-medium text-slate-900">{school.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Coaches</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{coachesCount.count || 0}</p>
              </div>
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Parents</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{parentsCount.count || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Programs</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{programsCount.count || 0}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Messages</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{communicationsCount.count || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <a
              href="/school-admin/users/new"
              className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <PlusIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                    Add User
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Create a new coach, parent, or admin
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/school-admin/programs/new"
              className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrophyIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                    Create Program
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Launch a new athletic program
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/school-admin/communications/send"
              className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                    Send Message
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Communicate with your community
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
