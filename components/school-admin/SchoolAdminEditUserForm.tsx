'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  archived: boolean;
}

interface SchoolAdminEditUserFormProps {
  user: User;
  schoolId: string;
}

export default function SchoolAdminEditUserForm({ user, schoolId }: SchoolAdminEditUserFormProps) {
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [phone, setPhone] = useState(user.phone || '');
  const [role, setRole] = useState<'coach' | 'parent' | 'school_admin'>(user.role as any);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/school-admin/users/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          role,
          school_id: schoolId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      router.push('/school-admin/users');
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

      router.push('/school-admin/users');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="coach">Coach</option>
            <option value="parent">Parent</option>
            <option value="school_admin">School Admin</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            User will remain assigned to your school
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 school-btn-primary py-2 rounded-lg disabled:bg-gray-400 transition"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <a
            href="/school-admin/users"
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition text-center flex items-center justify-center"
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
              ? 'school-btn-primary'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {loading ? 'Processing...' : user.archived ? 'Unarchive User' : 'Archive User'}
        </button>
      </div>
    </div>
  );
}
