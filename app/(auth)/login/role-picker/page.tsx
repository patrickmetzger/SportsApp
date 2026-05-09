import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRoles } from '@/lib/auth';
import RolePickerClient from './RolePickerClient';

const ROLE_LABELS: Record<string, string> = {
  admin: 'System Administrator',
  school_admin: 'School Administrator',
  coach: 'Coach',
  assistant_coach: 'Assistant Coach',
  parent: 'Parent',
  student: 'Student',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Manage all schools, programs, and users',
  school_admin: "Manage your school's programs, coaches, and communications",
  coach: 'Create and manage your sports programs',
  assistant_coach: 'Support coaching duties for assigned programs',
  parent: 'Register your children and track their programs',
  student: 'View your programs and track your progress',
};

export default async function RolePickerPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const roles = await getUserRoles();

  // If the user only has one role, skip the picker
  if (roles.length <= 1) redirect('/dashboard');

  return (
    <RolePickerClient
      roles={roles}
      roleLabels={ROLE_LABELS}
      roleDescriptions={ROLE_DESCRIPTIONS}
    />
  );
}
