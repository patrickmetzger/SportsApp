'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  archivedUsers: User[];
}

export default function UsersPageClient({ initialUsers, archivedUsers }: UsersPageClientProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: '',
    schoolId: '',
  });
  const [showArchived, setShowArchived] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    if (filters.schoolId) {
      if (filters.schoolId === 'unassigned') {
        filtered = filtered.filter((user) => user.role === 'coach' && !user.school);
      } else {
        filtered = filtered.filter((user) => user.school?.id === filters.schoolId);
      }
    }

    return filtered;
  }, [initialUsers, filters]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <UserFilters onFilterChange={handleFilterChange} />

      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredUsers.length} of {initialUsers.length} users
        {(filters.search || filters.role || filters.schoolId) && (
          <span className="ml-2 text-blue-600 font-medium">(filtered)</span>
        )}
      </div>

      <UsersList users={filteredUsers} />

      {/* Archived Users Section */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <button
          onClick={() => setShowArchived((v) => !v)}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
          {showArchived ? '▾ Hide Archived Users' : `▸ Show Archived Users (${archivedUsers.length})`}
        </button>

        {showArchived && (
          <div className="mt-4 overflow-x-auto">
            {archivedUsers.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">No archived users.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {archivedUsers.map((user) => (
                    <tr key={user.id} className="opacity-60 hover:opacity-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.first_name} {user.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`)}
                          disabled={deletingId === user.id}
                          className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                        >
                          {deletingId === user.id ? 'Deleting…' : 'Delete Permanently'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
