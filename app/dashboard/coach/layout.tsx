import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { coachNavigation, getRoleDisplayName } from '@/lib/navigation';

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireRole('coach');
    const supabase = await createClient();

    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      redirect('/login');
    }

    const { data: userData } = await supabase
      .from('users')
      .select('email, first_name, last_name, school:school_id(name)')
      .eq('id', effectiveUserId)
      .single();

    const school = Array.isArray(userData?.school) ? userData.school[0] : userData?.school;
    const userName = userData?.first_name && userData?.last_name
      ? `${userData.first_name} ${userData.last_name}`
      : userData?.email || 'Coach';

    return (
      <DashboardLayout
        navigation={coachNavigation}
        user={{
          email: userData?.email || '',
          name: userName,
          role: getRoleDisplayName('coach'),
        }}
        schoolName={school?.name}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/coach' }]}
      >
        {children}
      </DashboardLayout>
    );
  } catch (error) {
    redirect('/login');
  }
}
