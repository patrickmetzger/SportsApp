import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { assistantCoachNavigation, getRoleDisplayName } from '@/lib/navigation';

export default async function AssistantCoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireRole('assistant_coach');
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
      : userData?.email || 'Assistant Coach';

    return (
      <DashboardLayout
        navigation={assistantCoachNavigation}
        user={{
          email: userData?.email || '',
          name: userName,
          role: getRoleDisplayName('assistant_coach'),
        }}
        schoolName={school?.name}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/assistant' }]}
      >
        {children}
      </DashboardLayout>
    );
  } catch (error) {
    redirect('/login');
  }
}
