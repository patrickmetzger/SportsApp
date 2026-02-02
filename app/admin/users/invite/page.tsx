'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InviteUserPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'coach' | 'assistant_coach' | 'parent' | 'student' | 'school_admin'>('coach');
  const [schoolId, setSchoolId] = useState('');
  const [schools, setSchools] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          school_id: (role === 'coach' || role === 'assistant_coach' || role === 'school_admin' || role === 'parent') && schoolId ? schoolId : null,
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
        router.push('/admin/users');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <a href="/admin/users" className="text-blue-600 hover:text-blue-800">
                ← Back to Users
              </a>
              <h1 className="text-xl font-bold text-gray-800">Invite User</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Send Invitation</h2>
            <p className="text-gray-600 mt-2">
              Send an email invitation for a new user to join the platform. They'll receive an email with a link to set up their account.
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
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="coach@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                The user will receive an invitation email at this address
              </p>
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
                <option value="coach">Coach</option>
                <option value="assistant_coach">Assistant Coach</option>
                <option value="parent">Parent</option>
                <option value="student">Student</option>
                <option value="school_admin">School Admin</option>
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
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name} {school.city && school.state ? `(${school.city}, ${school.state})` : ''}
                    </option>
                  ))}
                </select>
                {role === 'parent' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Assign parent to a school (optional but recommended)
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
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
              <a
                href="/admin/users"
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition text-center"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
