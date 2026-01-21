import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { createClient } from '@/lib/supabase/server';
import ParentDashboardClient from '@/components/parent/ParentDashboardClient';
import { generateCSSVariables } from '@/lib/colorPalette';
import '../school-styles.css';

export default async function ParentDashboard() {
  try {
    await requireRole('parent');
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    // Fetch parent's school information
    const { data: userData } = await supabase
      .from('users')
      .select(`
        email,
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
      { name: 'My Registrations', icon: 'Calendar' as const, href: '#registrations' },
      { name: 'My Children', icon: 'UserGroup' as const, href: '#children' },
      { name: 'Messages', icon: 'ChatBubble' as const, href: '#messages' },
      { name: 'Forms & Waivers', icon: 'DocumentText' as const, href: '#forms' },
    ];

    // Fetch parent's registrations with program details and payment info
    const { data: registrations } = await supabase
      .from('program_registrations')
      .select(`
        *,
        summer_programs (
          id,
          name,
          start_date,
          end_date
        )
      `)
      .eq('parent_user_id', effectiveUserId)
      .order('created_at', { ascending: false });

    // Fetch parent's children
    const { data: children } = await supabase
      .from('parent_children')
      .select('*')
      .eq('parent_user_id', effectiveUserId)
      .order('created_at', { ascending: false });

    // Calculate payment summary
    const paymentSummary = {
      totalDue: registrations?.reduce((sum, reg) => sum + (Number(reg.amount_due) || 0), 0) || 0,
      totalPaid: registrations?.reduce((sum, reg) => sum + (Number(reg.amount_paid) || 0), 0) || 0,
      outstanding: 0,
    };
    paymentSummary.outstanding = paymentSummary.totalDue - paymentSummary.totalPaid;

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
                <h1 className="text-xl font-semibold text-gray-900">Parent Dashboard</h1>
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
                Welcome back
              </h2>
              <p className="text-lg text-gray-600">
                Manage your registrations, children, and payments.
              </p>
            </div>

            <ParentDashboardClient
              initialRegistrations={registrations || []}
              initialChildren={children || []}
              paymentSummary={paymentSummary}
            />
          </main>
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
