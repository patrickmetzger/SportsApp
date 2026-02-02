'use client';

import { useState, useEffect } from 'react';

interface School {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

interface UserFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  role: string;
  schoolId: string;
}

export default function UserFilters({ onFilterChange }: UserFiltersProps) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch('/api/admin/schools');
        if (response.ok) {
          const data = await response.json();
          setSchools(data.schools || []);
        }
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      }
    };

    fetchSchools();
  }, []);

  useEffect(() => {
    onFilterChange({ search, role, schoolId });
  }, [search, role, schoolId, onFilterChange]);

  const handleReset = () => {
    setSearch('');
    setRole('');
    setSchoolId('');
  };

  const hasActiveFilters = search || role || schoolId;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Filter Users</h3>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
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
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Role Filter */}
        <div>
          <label htmlFor="role" className="block text-xs font-medium text-gray-700 mb-1">
            Filter by Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="school_admin">School Admin</option>
            <option value="coach">Coach</option>
            <option value="assistant_coach">Assistant Coach</option>
            <option value="parent">Parent</option>
            <option value="student">Student</option>
          </select>
        </div>

        {/* School Filter */}
        <div>
          <label htmlFor="school" className="block text-xs font-medium text-gray-700 mb-1">
            Filter by School
          </label>
          <select
            id="school"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Schools</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name} {school.city && school.state ? `(${school.city}, ${school.state})` : ''}
              </option>
            ))}
            <option value="unassigned">Unassigned Coaches</option>
          </select>
        </div>
      </div>
    </div>
  );
}
