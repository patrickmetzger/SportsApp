import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  try {
    const { user } = await requireRole('admin');

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b-2 border-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <form action="/api/auth/logout" method="POST">
                  <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Welcome, Administrator!
            </h2>
            <p className="text-gray-600 mb-6">
              Manage the entire sports management system from this central dashboard.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <a href="/admin/users" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition block">
                <h3 className="font-semibold text-lg mb-2">User Management</h3>
                <p className="text-gray-600 text-sm">Manage students, parents, coaches, and admins</p>
              </a>

              <a href="/admin/schools" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition block">
                <h3 className="font-semibold text-lg mb-2">Schools Management</h3>
                <p className="text-gray-600 text-sm">Manage schools and assign coaches</p>
              </a>

              <a href="/admin/programs" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition block">
                <h3 className="font-semibold text-lg mb-2">Program Management</h3>
                  <p className="text-gray-600 text-sm">Manage all programs</p>
                  </a>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-semibold text-lg mb-2">Team Management</h3>
                <p className="text-gray-600 text-sm">Create and manage sports teams</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-semibold text-lg mb-2">Reports & Analytics</h3>
                <p className="text-gray-600 text-sm">View system-wide reports and statistics</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-semibold text-lg mb-2">Settings</h3>
                <p className="text-gray-600 text-sm">Configure system settings and preferences</p>
              </div>

              <a href="/admin/communications" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition block">
                <h3 className="font-semibold text-lg mb-2">Communications</h3>
                <p className="text-gray-600 text-sm">Send announcements and messages to coaches</p>
              </a>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-semibold text-lg mb-2">Facilities</h3>
                <p className="text-gray-600 text-sm">Manage sports facilities and equipment</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-semibold text-lg mb-2">Payments</h3>
                <p className="text-gray-600 text-sm">Track fees, payments, and financial records</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-semibold text-lg mb-2">Audit Logs</h3>
                <p className="text-gray-600 text-sm">View system activity and audit trails</p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">System Status</h3>
            <p className="text-blue-600 text-sm">All systems operational</p>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
