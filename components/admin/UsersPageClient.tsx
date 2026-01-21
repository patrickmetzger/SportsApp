'use client';

import { useState, useMemo } from 'react';
import UserFilters, { FilterState } from './UserFilters';
import UsersList from './UsersList';

interface School {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  archived: boolean;
  school?: School;
}

interface UsersPageClientProps {
  initialUsers: User[];
}

export default function UsersPageClient({ initialUsers }: UsersPageClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: '',
    schoolId: '',
  });

  const filteredUsers = useMemo(() => {
    let filtered = [...initialUsers];

    // Filter by search (name or email)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((user) => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const email = user.email.toLowerCase();
        return fullName.includes(searchLower) || email.includes(searchLower);
      });
    }

    // Filter by role
    if (filters.role) {
      filtered = filtered.filter((user) => user.role === filters.role);
    }

    // Filter by school
    if (filters.schoolId) {
      if (filters.schoolId === 'unassigned') {
        // Show coaches with no school assigned
        filtered = filtered.filter((user) => user.role === 'coach' && !user.school);
      } else {
        // Show users from specific school
        filtered = filtered.filter((user) => user.school?.id === filters.schoolId);
      }
    }

    return filtered;
  }, [initialUsers, filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <div>
      <UserFilters onFilterChange={handleFilterChange} />

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredUsers.length} of {initialUsers.length} users
        {(filters.search || filters.role || filters.schoolId) && (
          <span className="ml-2 text-blue-600 font-medium">
            (filtered)
          </span>
        )}
      </div>

      <UsersList users={filteredUsers} />
    </div>
  );
}
