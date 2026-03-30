import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  BellIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default async function SchoolAdminSettingsPage() {
  try {
    await requireRole('school_admin');

    const settingsLinks = [
      {
        name: 'Notifications',
        description: 'Configure notification schedules and email alerts for coaches and staff',
        href: '/school-admin/settings/notifications',
        icon: BellIcon,
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
      },
    ];

    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">
            Manage your school configuration and preferences.
          </p>
        </div>

        {/* Settings Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {settingsLinks.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {item.description}
                  </p>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
