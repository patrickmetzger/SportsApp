import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SchoolsList from '@/components/admin/SchoolsList';

export default async function SchoolsPage() {
  try {
    await requireRole('admin');
    const supabase = await createClient();

    // Fetch all schools
    const { data: schools } = await supabase
      .from('schools')
      .select('*')
      .order('name', { ascending: true });

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-8">
                <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                  ← Back to Admin
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Schools Management</h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SchoolsList schools={schools || []} />
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
