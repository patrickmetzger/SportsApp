import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { schoolAdminNavigation, getRoleDisplayName, NavItem } from '@/lib/navigation';
import { generateCSSVariables } from '@/lib/colorPalette';
import './school-admin.css';

export default async function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      redirect('/login');
    }

    const { data: userData } = await supabase
      .from('users')
      .select('email, first_name, last_name, school_id, school:school_id(id, name, logo_url, primary_color, secondary_color)')
      .eq('id', effectiveUserId)
      .single();

    if (!userData?.school || !userData?.school_id) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-card p-8 max-w-md">
            <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3 text-center">No School Assigned</h2>
            <p className="text-slate-500 text-center mb-6">
              Your school administrator account is not assigned to a school. Please contact a system administrator to assign your account to a school.
            </p>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full bg-slate-900 text-white text-center py-3 rounded-lg hover:bg-slate-800 transition font-semibold"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      );
    }

    const school = Array.isArray(userData.school) ? userData.school[0] : userData.school;
    const userName = userData?.first_name && userData?.last_name
      ? `${userData.first_name} ${userData.last_name}`
      : userData?.email || 'School Admin';

    // Fetch pending counts for badge
    let pendingCount = 0;
    if (userData.school_id) {
      const adminClient = createAdminClient();
      const [{ count: assistantCount }, { count: programCount }] = await Promise.all([
        adminClient
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', userData.school_id)
          .eq('role', 'assistant_coach')
          .eq('approval_status', 'pending'),
        adminClient
          .from('summer_programs')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', userData.school_id)
          .eq('status', 'pending'),
      ]);
      pendingCount = (assistantCount || 0) + (programCount || 0);
    }

    const navigation: NavItem[] = schoolAdminNavigation.map((item) =>
      item.href === '/school-admin/pending-approvals' && pendingCount > 0
        ? { ...item, badge: pendingCount }
        : item
    );

    // Generate CSS variables from school colors
    const cssVariables = school?.primary_color && school?.secondary_color
      ? generateCSSVariables(school.primary_color, school.secondary_color)
      : '';

    return (
      <div style={cssVariables ? { ...Object.fromEntries(
        cssVariables.trim().split(';')
          .filter(s => s.trim())
          .map(s => {
            const [key, value] = s.split(':').map(p => p.trim());
            return [key, value];
          })
      )} as React.CSSProperties : undefined}>
        <DashboardLayout
          navigation={navigation}
          user={{
            email: userData?.email || '',
            name: userName,
            role: getRoleDisplayName('school_admin'),
          }}
          schoolName={school?.name}
          breadcrumbs={[{ label: 'Dashboard', href: '/school-admin' }]}
        >
          {children}
        </DashboardLayout>
      </div>
    );
  } catch (error) {
    console.error('School admin layout error:', error);
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-card p-8 max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-3 text-center">Access Error</h2>
          <p className="text-slate-500 text-center mb-6">
            There was an error loading your school admin dashboard. You may not have the required permissions or your account may not be properly configured.
          </p>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full bg-slate-900 text-white text-center py-3 rounded-lg hover:bg-slate-800 transition font-semibold"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    );
  }
}
