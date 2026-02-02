import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // getUserRole now automatically handles impersonation
  const role = await getUserRole();

  console.log('Dashboard - User:', user.email, 'Role:', user);

  // If no role found, show error instead of redirecting
  if (!role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-600 text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">No Role Assigned</h2>
          <p className="text-gray-600 text-center mb-4">
            Your account exists but has no role assigned in the database.
          </p>
          <div className="bg-gray-100 p-3 rounded mb-4 text-sm font-mono">
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>User ID:</strong> {user.id}</div>
            <div><strong>Role:</strong> {role || 'NULL'}</div>
          </div>
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

  switch (role) {
    case 'admin':
      redirect('/admin');
    case 'school_admin':
      redirect('/school-admin');
    case 'coach':
      redirect('/dashboard/coach');
    case 'assistant_coach':
      redirect('/dashboard/assistant');
    case 'student':
      redirect('/dashboard/student');
    case 'parent':
      redirect('/dashboard/parent');
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="text-yellow-600 text-5xl mb-4 text-center">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Unknown Role</h2>
            <p className="text-gray-600 text-center mb-4">
              Your account has an unrecognized role: <strong>{role}</strong>
            </p>
            <div className="bg-gray-100 p-3 rounded mb-4 text-sm font-mono">
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>User ID:</strong> {user.id}</div>
              <div><strong>Role:</strong> {role}</div>
            </div>
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
