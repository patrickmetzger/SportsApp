'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bars3Icon, BellIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import {
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  CreditCardIcon,
  CalendarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

interface DashboardHeaderProps {
  breadcrumbs: Breadcrumb[];
  userName: string;
  userRole: string;
  onMenuToggle: () => void;
}

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  new_registration: UserPlusIcon,
  message: ChatBubbleLeftIcon,
  incident_report: ExclamationTriangleIcon,
  incident_update: ExclamationTriangleIcon,
  payment_received: CreditCardIcon,
  program_update: CalendarIcon,
  schedule_change: CalendarIcon,
  certification_expiring: ShieldCheckIcon,
  certification_expired: ShieldCheckIcon,
  certification_missing: ShieldCheckIcon,
};

const notificationColors: Record<string, string> = {
  new_registration: 'bg-teal-100 text-teal-600',
  message: 'bg-blue-100 text-blue-600',
  incident_report: 'bg-red-100 text-red-600',
  incident_update: 'bg-orange-100 text-orange-600',
  payment_received: 'bg-green-100 text-green-600',
  program_update: 'bg-purple-100 text-purple-600',
  schedule_change: 'bg-yellow-100 text-yellow-600',
  certification_expiring: 'bg-yellow-100 text-yellow-600',
  certification_expired: 'bg-red-100 text-red-600',
  certification_missing: 'bg-red-100 text-red-600',
};

export default function DashboardHeader({
  breadcrumbs,
  userName,
  userRole,
  onMenuToggle,
}: DashboardHeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getUserInitials = () => {
    if (userName) {
      const parts = userName.split(' ');
      return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
    setIsOpen(false);
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
          {/* Notification bell with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      disabled={loading}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <BellIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const Icon = notificationIcons[notification.type] || BellIcon;
                      const colorClass = notificationColors[notification.type] || 'bg-slate-100 text-slate-600';

                      return (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left ${
                            !notification.read ? 'bg-teal-50/50' : ''
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

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
