'use client';

import { useState, useEffect } from 'react';

interface FilterState {
  search: string;
  role: string;
}

interface SchoolAdminUserFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export default function SchoolAdminUserFilters({ onFilterChange }: SchoolAdminUserFiltersProps) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    onFilterChange({ search, role });
  }, [search, role, onFilterChange]);

  const handleReset = () => {
    setSearch('');
    setRole('');
  };

  const hasActiveFilters = search || role;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Filter Users</h3>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
            Search by Name or Email
          </label>
          <input
            id="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to search..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-xs font-medium text-gray-700 mb-1">
            Filter by Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="coach">Coach</option>
            <option value="assistant_coach">Assistant Coach</option>
            <option value="parent">Parent</option>
            <option value="school_admin">School Admin</option>
          </select>
        </div>
      </div>
    </div>
  );
}
