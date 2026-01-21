import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SchoolSettingsForm from '@/components/school-admin/SchoolSettingsForm';

export default async function SchoolSettingsPage() {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    const { data: userData } = await supabase
      .from('users')
      .select(`
        school_id,
        school:school_id (*)
      `)
      .eq('id', effectiveUserId)
      .single();

    const school = Array.isArray(userData?.school) ? userData.school[0] : userData?.school;

    if (!school) {
      redirect('/school-admin');
    }

    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">School Settings</h1>
          <SchoolSettingsForm school={school} />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
