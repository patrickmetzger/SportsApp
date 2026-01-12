'use client';

import { useState } from 'react';
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  Cog6ToothIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';

interface SchoolAdminSidebarProps {
  userEmail?: string;
  schoolName?: string;
  schoolLogo?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function SchoolAdminSidebar({
  userEmail,
  schoolName,
  schoolLogo,
  primaryColor = '#16a34a',
  secondaryColor = '#22c55e'
}: SchoolAdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', icon: HomeIcon, href: '/school-admin' },
    { name: 'Users', icon: UserGroupIcon, href: '/school-admin/users' },
    { name: 'Communications', icon: ChatBubbleLeftRightIcon, href: '/school-admin/communications' },
    { name: 'Programs', icon: CalendarIcon, href: '/school-admin/programs' },
    { name: 'School Settings', icon: Cog6ToothIcon, href: '/school-admin/school' },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div
        className="h-16 border-b border-gray-200 flex items-center justify-between px-4"
        style={{ backgroundColor: primaryColor }}
      >
        {!collapsed && (
          <div className="text-white flex items-center gap-3">
            {schoolLogo && (
              <img
                src={schoolLogo}
                alt={`${schoolName} logo`}
                className="h-10 w-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <h1 className="text-sm font-semibold truncate">{schoolName}</h1>
              <p className="text-xs opacity-90">School Admin</p>
            </div>
          </div>
        )}
        {collapsed && schoolLogo && (
          <img
            src={schoolLogo}
            alt={`${schoolName} logo`}
            className="h-8 w-8 object-contain mx-auto"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg transition text-white hover:opacity-80"
          style={{ backgroundColor: `${primaryColor}dd` }}
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = pathname === item.href || (item.href !== '/school-admin' && pathname?.startsWith(item.href));

          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={isActive ? {
                backgroundColor: `${primaryColor}15`,
                color: primaryColor
              } : undefined}
            >
              <IconComponent className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.name}</span>}
            </a>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4">
        {userEmail && (
          <div className={`flex items-center gap-3 mb-3 ${collapsed ? 'justify-center' : ''}`}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {userEmail.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
              </div>
            )}
          </div>
        )}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className={`w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
