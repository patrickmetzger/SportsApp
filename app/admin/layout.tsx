import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation, getRoleDisplayName } from '@/lib/navigation';

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

    return (
      <DashboardLayout
        navigation={adminNavigation}
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
