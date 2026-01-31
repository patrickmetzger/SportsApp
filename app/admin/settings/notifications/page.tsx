import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NotificationScheduleConfig from '@/components/admin/NotificationScheduleConfig';

export default async function AdminNotificationSettingsPage() {
  try {
    await requireRole('admin');

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b-2 border-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-4">
                <a href="/admin/settings" className="text-blue-600 hover:text-blue-800">
                  &larr; Back to Settings
                </a>
                <h1 className="text-xl font-bold text-gray-800">
                  Notification Settings
                </h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <NotificationScheduleConfig isSchoolAdmin={false} />
          </div>

          {/* Info box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900">How Notifications Work</h4>
            <ul className="mt-2 text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Notifications are sent daily at 9am based on your configured schedules</li>
              <li>Each coach receives one notification per schedule per certification</li>
              <li>Global schedules apply to all schools unless overridden</li>
              <li>Both email and in-app notifications can be configured</li>
            </ul>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
