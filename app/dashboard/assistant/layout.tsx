import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { assistantCoachNavigation, pendingAssistantNavigation, getRoleDisplayName } from '@/lib/navigation';

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
      .select('email, first_name, last_name, approval_status, school:school_id(name)')
      .eq('id', effectiveUserId)
      .single();

    const school = Array.isArray(userData?.school) ? userData.school[0] : userData?.school;
    const userName = userData?.first_name && userData?.last_name
      ? `${userData.first_name} ${userData.last_name}`
      : userData?.email || 'Assistant Coach';

    const isPending = userData?.approval_status === 'pending';
    const isRejected = userData?.approval_status === 'rejected';

    // Get the current path to determine if we need to redirect
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';

    // If pending or rejected, only allow access to pending status page and certifications
    if (isPending || isRejected) {
      const allowedPaths = ['/dashboard/assistant/pending', '/dashboard/assistant/certifications'];
      const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));

      // If trying to access main dashboard or other restricted pages, redirect to pending
      if (!isAllowedPath && pathname === '/dashboard/assistant') {
        redirect('/dashboard/assistant/pending');
      }
    }

    // Use pending navigation if not approved
    const navigation = (isPending || isRejected) ? pendingAssistantNavigation : assistantCoachNavigation;

    // Custom role display for pending users
    const roleDisplay = isPending
      ? 'Assistant Coach (Pending)'
      : isRejected
        ? 'Assistant Coach (Not Approved)'
        : getRoleDisplayName('assistant_coach');

    return (
      <DashboardLayout
        navigation={navigation}
        user={{
          email: userData?.email || '',
          name: userName,
          role: roleDisplay,
        }}
        schoolName={school?.name}
        breadcrumbs={[{ label: 'Dashboard', href: isPending || isRejected ? '/dashboard/assistant/pending' : '/dashboard/assistant' }]}
      >
        {children}
      </DashboardLayout>
    );
  } catch (error) {
    redirect('/login');
  }
}
