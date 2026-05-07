'use client';

import { useState, useMemo } from 'react';
import SchoolAdminUserFilters from './SchoolAdminUserFilters';
import SchoolAdminUsersList from './SchoolAdminUsersList';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  archived: boolean;
  phone?: string;
}

interface SchoolAdminUsersClientProps {
  initialUsers: User[];
  initialRole?: string;
}

export default function SchoolAdminUsersClient({ initialUsers, initialRole = '' }: SchoolAdminUsersClientProps) {
  const [filters, setFilters] = useState({
    search: '',
    role: initialRole,
  });

  const filteredUsers = useMemo(() => {
    let filtered = [...initialUsers];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((user) => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const email = user.email.toLowerCase();
        return fullName.includes(searchLower) || email.includes(searchLower);
      });
    }

    if (filters.role) {
      filtered = filtered.filter((user) => user.role === filters.role);
    }

    return filtered;
  }, [initialUsers, filters]);

  return (
    <div>
      <SchoolAdminUserFilters onFilterChange={setFilters} initialRole={initialRole} />

      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredUsers.length} of {initialUsers.length} users
      </div>

      <SchoolAdminUsersList users={filteredUsers} />
    </div>
  );
}
