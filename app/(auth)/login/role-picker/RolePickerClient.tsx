'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLE_ICONS: Record<string, string> = {
  admin: '⚙️',
  school_admin: '🏫',
  coach: '🏅',
  assistant_coach: '🤝',
  parent: '👨‍👩‍👧',
  student: '🎒',
};

interface RolePickerClientProps {
  roles: string[];
  roleLabels: Record<string, string>;
  roleDescriptions: Record<string, string>;
}

export default function RolePickerClient({ roles, roleLabels, roleDescriptions }: RolePickerClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSelectRole = async (role: string) => {
    setLoading(role);
    setError('');

    try {
      const response = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to switch role');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Welcome back</h1>
        <p className="text-gray-500 text-center mb-8">
          You have multiple roles. Which would you like to use today?
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => handleSelectRole(role)}
              disabled={loading !== null}
              className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-60 text-left"
            >
              <span className="text-3xl">{ROLE_ICONS[role] ?? '👤'}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">
                  {roleLabels[role] ?? role}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {roleDescriptions[role] ?? ''}
                </div>
              </div>
              {loading === role && (
                <span className="text-blue-500 text-sm">Loading...</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
