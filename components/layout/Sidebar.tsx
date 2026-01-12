'use client';

import { useState } from 'react';
import {
  UserGroupIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  DocumentTextIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

const iconMap = {
  UserGroup: UserGroupIcon,
  Calendar: CalendarIcon,
  ChatBubble: ChatBubbleLeftRightIcon,
  CreditCard: CreditCardIcon,
  DocumentText: DocumentTextIcon,
};

interface NavItem {
  name: string;
  icon: keyof typeof iconMap;
  href: string;
}

interface SidebarProps {
  items: NavItem[];
  userEmail?: string;
  schoolName?: string;
  schoolLogo?: string;
}

export default function Sidebar({ items, userEmail, schoolName, schoolLogo }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button - Fixed at top left */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition"
        aria-label="Open menu"
      >
        <Bars3Icon className="w-6 h-6 text-gray-700" />
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile unless menu is open */}
      <div className={`bg-white school-branded-sidebar h-screen flex flex-col transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'}
        md:relative fixed top-0 left-0 z-50
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      {/* Header */}
      <div className="h-16 school-branded-sidebar-header flex items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            {schoolLogo && (
              <img
                src={schoolLogo}
                alt={schoolName}
                className="h-8 w-auto"
              />
            )}
            <div>
              <h1 className="text-sm font-semibold text-white">{schoolName || 'Dashboard'}</h1>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          {/* Close button for mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
          {/* Collapse button for desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block p-2 hover:bg-white/10 rounded-lg transition"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {items.map((item) => {
          const IconComponent = iconMap[item.icon];
          return (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition group ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <IconComponent className="w-5 h-5 text-gray-600 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.name}</span>
              )}
            </a>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4">
        {userEmail && (
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0" style={{
              backgroundColor: 'var(--school-primary, #3b82f6)'
            }}>
              {userEmail.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
              </div>
            )}
          </div>
        )}
        <form action="/api/auth/logout" method="POST" className="mt-3">
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
    </>
  );
}
