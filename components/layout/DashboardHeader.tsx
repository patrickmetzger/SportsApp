'use client';

import Link from 'next/link';
import { Bars3Icon, BellIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface DashboardHeaderProps {
  breadcrumbs: Breadcrumb[];
  userName: string;
  userRole: string;
  onMenuToggle: () => void;
}

export default function DashboardHeader({
  breadcrumbs,
  userName,
  userRole,
  onMenuToggle,
}: DashboardHeaderProps) {
  const getUserInitials = () => {
    if (userName) {
      const parts = userName.split(' ');
      return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu + Breadcrumbs */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-700 lg:hidden"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.label} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                )}
                {crumb.href && index < breadcrumbs.length - 1 ? (
                  <Link
                    href={crumb.href}
                    className="text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      index === breadcrumbs.length - 1
                        ? 'text-teal-600 font-medium'
                        : 'text-slate-500'
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Right side - Notifications + User */}
        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
            <BellIcon className="w-5 h-5" />
          </button>

          {/* User dropdown */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="w-9 h-9 bg-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{getUserInitials()}</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-slate-900">{userName}</p>
              <p className="text-xs text-slate-500">{userRole}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
