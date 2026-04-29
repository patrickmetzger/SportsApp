import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation, getRoleDisplayName, NavItem } from '@/lib/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { user } = await requireRole('admin');
    const supabase = await createClient();

    const { data: userData } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    const userName = userData?.first_name && userData?.last_name
      ? `${userData.first_name} ${userData.last_name}`
      : userData?.email || 'Admin';

    // Fetch pending count for badge
    const adminClient = createAdminClient();
    const { count: pendingCount } = await adminClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'assistant_coach')
      .eq('approval_status', 'pending');

    const navigation: NavItem[] = adminNavigation.map((item) =>
      item.href === '/admin/pending-approvals' && (pendingCount ?? 0) > 0
        ? { ...item, badge: pendingCount ?? 0, badgeColor: 'bg-blue-500' }
        : item
    );

    return (
      <DashboardLayout
        navigation={navigation}
        user={{
          email: userData?.email || user.email || '',
          name: userName,
          role: getRoleDisplayName('admin'),
        }}
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }]}
      >
        {children}
      </DashboardLayout>
    );
  } catch (error) {
    redirect('/login');
  }
}
