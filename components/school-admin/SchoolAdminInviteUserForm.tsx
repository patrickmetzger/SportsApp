'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SchoolAdminInviteUserFormProps {
  schoolId: string;
}

export default function SchoolAdminInviteUserForm({ schoolId }: SchoolAdminInviteUserFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'coach' | 'assistant_coach' | 'parent' | 'school_admin'>('coach');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/school-admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          school_id: schoolId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      setSuccess(true);
      setEmail('');

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/school-admin/users');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Send Invitation</h2>
        <p className="text-gray-600 mt-2">
          Send an email invitation for a new user to join your school. They'll receive an email with a link to set up their account.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
          Invitation sent successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="user@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            The user will receive an invitation email at this address
          </p>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="coach">Coach</option>
            <option value="assistant_coach">Assistant Coach</option>
            <option value="parent">Parent</option>
            <option value="school_admin">School Admin</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {role === 'assistant_coach'
              ? 'Assistant Coaches help coaches with attendance and can view their programs'
              : 'User will be automatically assigned to your school'}
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 school-btn-primary py-2 rounded-lg disabled:bg-gray-400 transition"
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
          <a
            href="/school-admin/users"
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition text-center flex items-center justify-center"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
