'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

// Icon map to convert string names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
};

export interface NavItem {
  name: string;
  href: string;
  icon: string;
  children?: { name: string; href: string }[];
}

interface DashboardSidebarProps {
  navigation: NavItem[];
  userEmail: string;
  userName: string;
  userRole: string;
  schoolName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardSidebar({
  navigation,
  userEmail,
  userName,
  userRole,
  schoolName,
  isOpen,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/school-admin' || href === '/dashboard/coach' || href === '/dashboard/parent') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const isChildActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some((child) => pathname.startsWith(child.href));
  };

  const getUserInitials = () => {
    if (userName) {
      const parts = userName.split(' ');
      return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2);
    }
    return userEmail?.[0]?.toUpperCase() || 'U';
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || HomeIcon;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className="p-4">
        <div className="bg-white rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navy-900 rounded-lg flex items-center justify-center">
              <span className="text-teal-400 font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="font-bold text-navy-900 text-sm">SchoolSports</h1>
              {schoolName && (
                <p className="text-xs text-slate-500 truncate max-w-[140px]">{schoolName}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = getIcon(item.icon);
          const active = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const expanded = expandedItems.includes(item.name) || isChildActive(item);

          return (
            <div key={item.name}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isChildActive(item)
                        ? 'text-teal-400 bg-teal-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    {expanded ? (
                      <ChevronDownIcon className="w-4 h-4" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                  </button>
                  {expanded && (
                    <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                      {item.children?.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive(child.href)
                              ? 'text-teal-400 bg-teal-500/10'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'text-teal-400 bg-teal-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">{getUserInitials()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName || userEmail}</p>
            <p className="text-xs text-slate-400 truncate">{userRole}</p>
          </div>
        </div>
        <form action="/api/auth/logout" method="POST" className="mt-3">
          <button
            type="submit"
            className="w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all text-left"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-navy-900 z-50 transform transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-navy-900 shadow-sidebar">
        <SidebarContent />
      </div>
    </>
  );
}
