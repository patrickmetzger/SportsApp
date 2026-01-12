import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SchoolAdminSidebar from '@/components/school-admin/SchoolAdminSidebar';
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

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, first_name, last_name, school_id, school:school_id(id, name, logo_url, primary_color, secondary_color)')
      .eq('id', effectiveUserId)
      .single();

    if (!userData?.school || !userData?.school_id) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="text-red-600 text-5xl mb-4 text-center">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">No School Assigned</h2>
            <p className="text-gray-600 text-center mb-6">
              Your school administrator account is not assigned to a school. Please contact a system administrator to assign your account to a school.
            </p>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full bg-gray-600 text-white text-center py-3 rounded-lg hover:bg-gray-700 transition font-semibold"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      );
    }

    // Use school colors or defaults
    const primaryColor = userData.school.primary_color || '#16a34a';
    const secondaryColor = userData.school.secondary_color || '#22c55e';

    // Generate full color palette
    const cssVariables = generateCSSVariables(primaryColor, secondaryColor);

    return (
      <div className="flex h-screen overflow-hidden">
        <style dangerouslySetInnerHTML={{
          __html: `:root { ${cssVariables} }`
        }} />
        <SchoolAdminSidebar
          userEmail={userData.email}
          schoolName={userData.school.name}
          schoolLogo={userData.school.logo_url}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    );
  } catch (error) {
    console.error('School admin layout error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-600 text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Access Error</h2>
          <p className="text-gray-600 text-center mb-6">
            There was an error loading your school admin dashboard. You may not have the required permissions or your account may not be properly configured.
          </p>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full bg-gray-600 text-white text-center py-3 rounded-lg hover:bg-gray-700 transition font-semibold"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    );
  }
}
