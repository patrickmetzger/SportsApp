'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'school_admin' | 'coach' | 'assistant_coach' | 'parent' | 'student';
  school_id?: string;
  archived: boolean;
}

interface EditUserFormProps {
  user: User;
}

export default function EditUserForm({ user }: EditUserFormProps) {
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [schoolId, setSchoolId] = useState(user.school_id || '');
  const [schools, setSchools] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  // Filter schools to only show available ones
  // Available = schools with no coaches OR the current user's school
  const availableSchools = schools.filter((school) => {
    // Always include the user's current school
    if (user.school_id === school.id) {
      return true;
    }
    // Otherwise, we'd need to check if school has coaches
    // For simplicity, we'll show all schools in edit mode
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          email,
          role,
          school_id: (role === 'coach' || role === 'assistant_coach' || role === 'school_admin' || role === 'parent') && schoolId ? schoolId : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      router.push('/admin/users');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleArchive = async () => {
    if (!confirm(`Are you sure you want to ${user.archived ? 'unarchive' : 'archive'} this user?`)) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/toggle-archive-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          archived: !user.archived,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle archive status');
      }

      router.push('/admin/users');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit User Details</h2>
        <p className="text-gray-600 mt-2">
          Update the user's information below. User ID: {user.id}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="admin">Admin</option>
            <option value="school_admin">School Admin</option>
            <option value="coach">Coach</option>
            <option value="assistant_coach">Assistant Coach</option>
            <option value="parent">Parent</option>
            <option value="student">Student</option>
          </select>
        </div>

        {(role === 'coach' || role === 'assistant_coach' || role === 'school_admin' || role === 'parent') && (
          <div>
            <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
              School {(role === 'coach' || role === 'assistant_coach' || role === 'school_admin') && '*'}
            </label>
            <select
              id="school"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              required={role === 'coach' || role === 'assistant_coach' || role === 'school_admin'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a school...</option>
              {availableSchools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} {school.city && school.state ? `(${school.city}, ${school.state})` : ''}
                </option>
              ))}
            </select>
            {role === 'coach' && (
              <p className="text-xs text-gray-500 mt-1">
                Note: Use "Assign Coaches" from Schools Management to reassign coaches between schools
              </p>
            )}
            {role === 'assistant_coach' && (
              <p className="text-xs text-gray-500 mt-1">
                Assistant Coaches help coaches with attendance and can view their programs
              </p>
            )}
            {role === 'school_admin' && (
              <p className="text-xs text-gray-500 mt-1">
                School Admins can manage everything for their assigned school
              </p>
            )}
            {role === 'parent' && (
              <p className="text-xs text-gray-500 mt-1">
                Assign parent to a school (optional but recommended)
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <a
            href="/admin/users"
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition text-center"
          >
            Cancel
          </a>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Archive User</h3>
        <p className="text-sm text-gray-600 mb-4">
          {user.archived
            ? 'This user is currently archived. Unarchive to restore access and visibility.'
            : 'Archive this user to remove their access and hide them from most lists. They can be unarchived later.'}
        </p>
        <button
          type="button"
          onClick={handleToggleArchive}
          disabled={loading}
          className={`px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 ${
            user.archived
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {loading ? 'Processing...' : user.archived ? 'Unarchive User' : 'Archive User'}
        </button>
      </div>
    </div>
  );
}
