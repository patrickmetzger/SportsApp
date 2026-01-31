export interface NavItem {
  name: string;
  href: string;
  icon: string;
  children?: { name: string; href: string }[];
}

export const adminNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: 'HomeIcon' },
  { name: 'User Management', href: '/admin/users', icon: 'UsersIcon' },
  { name: 'Schools', href: '/admin/schools', icon: 'AcademicCapIcon' },
  { name: 'Programs', href: '/admin/programs', icon: 'TrophyIcon' },
  {
    name: 'Certifications',
    href: '/admin/certifications',
    icon: 'DocumentCheckIcon',
    children: [
      { name: 'Certification Types', href: '/admin/certification-types' },
      { name: 'Coach Certifications', href: '/admin/coach-certifications' },
    ]
  },
  { name: 'Communications', href: '/admin/communications', icon: 'ChatBubbleLeftRightIcon' },
  { name: 'Settings', href: '/admin/settings', icon: 'Cog6ToothIcon' },
];

export const schoolAdminNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/school-admin', icon: 'HomeIcon' },
  { name: 'Users', href: '/school-admin/users', icon: 'UsersIcon' },
  {
    name: 'Academic',
    href: '/school-admin/academic',
    icon: 'AcademicCapIcon',
    children: [
      { name: 'Programs', href: '/school-admin/programs' },
      { name: 'Attendance', href: '/school-admin/attendance' },
      { name: 'Sessions', href: '/school-admin/sessions' },
    ]
  },
  {
    name: 'Certifications',
    href: '/school-admin/certifications',
    icon: 'DocumentCheckIcon',
    children: [
      { name: 'Certification Types', href: '/school-admin/certification-types' },
      { name: 'Coach Certifications', href: '/school-admin/coach-certifications' },
    ]
  },
  { name: 'Communications', href: '/school-admin/communications', icon: 'ChatBubbleLeftRightIcon' },
  { name: 'School Settings', href: '/school-admin/school', icon: 'BuildingOfficeIcon' },
  { name: 'Settings', href: '/school-admin/settings', icon: 'Cog6ToothIcon' },
];

export const coachNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/coach', icon: 'HomeIcon' },
  { name: 'My Programs', href: '/dashboard/coach#programs', icon: 'TrophyIcon' },
  { name: 'Certifications', href: '/dashboard/coach/certifications', icon: 'DocumentCheckIcon' },
  { name: 'Attendance', href: '/dashboard/coach/attendance', icon: 'ClipboardDocumentListIcon' },
  { name: 'Report Incident', href: '/dashboard/coach/incident', icon: 'ExclamationTriangleIcon' },
];

export const parentNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/parent', icon: 'HomeIcon' },
  { name: 'My Children', href: '/dashboard/parent#children', icon: 'UserGroupIcon' },
  { name: 'Registrations', href: '/dashboard/parent#registrations', icon: 'ClipboardDocumentListIcon' },
  { name: 'Communications', href: '/dashboard/parent/communications', icon: 'ChatBubbleLeftRightIcon' },
  { name: 'Programs', href: '/programs', icon: 'TrophyIcon' },
];

export const studentNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/student', icon: 'HomeIcon' },
  { name: 'My Programs', href: '/dashboard/student/programs', icon: 'TrophyIcon' },
  { name: 'Schedule', href: '/dashboard/student/schedule', icon: 'CalendarIcon' },
  { name: 'Messages', href: '/dashboard/student/messages', icon: 'ChatBubbleLeftRightIcon' },
];

export function getNavigationByRole(role: string): NavItem[] {
  switch (role) {
    case 'admin':
      return adminNavigation;
    case 'school_admin':
      return schoolAdminNavigation;
    case 'coach':
      return coachNavigation;
    case 'parent':
      return parentNavigation;
    case 'student':
      return studentNavigation;
    default:
      return [];
  }
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'school_admin':
      return 'School Admin';
    case 'coach':
      return 'Coach';
    case 'parent':
      return 'Parent';
    case 'student':
      return 'Student';
    default:
      return role;
  }
}
