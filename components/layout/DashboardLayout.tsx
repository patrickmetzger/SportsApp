'use client';

import { useState, ReactNode } from 'react';
import DashboardSidebar, { NavItem } from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface UserInfo {
  email: string;
  name: string;
  role: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navigation: NavItem[];
  user: UserInfo;
  schoolName?: string;
  breadcrumbs: Breadcrumb[];
}

export default function DashboardLayout({
  children,
  navigation,
  user,
  schoolName,
  breadcrumbs,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar */}
      <DashboardSidebar
        navigation={navigation}
        userEmail={user.email}
        userName={user.name}
        userRole={user.role}
        schoolName={schoolName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72">
        {/* Header */}
        <DashboardHeader
          breadcrumbs={breadcrumbs}
          userName={user.name}
          userRole={user.role}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
