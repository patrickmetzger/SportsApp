'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProgramForm from '@/components/admin/ProgramForm';

interface School {
  id: string;
  name: string;
  city: string;
  state: string;
}

export default function NewProgramPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [loadingSchools, setLoadingSchools] = useState(true);

  useEffect(() => {
    fetch('/api/admin/schools')
      .then(r => r.json())
      .then(data => setSchools(data.schools || []))
      .catch(console.error)
      .finally(() => setLoadingSchools(false));
  }, []);

  const handleSubmit = async (formData: any) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/programs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, school_id: selectedSchoolId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create program');
      }

      router.push('/admin/programs');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedSchool = schools.find(s => s.id === selectedSchoolId);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b-2 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <a href="/admin/programs" className="text-blue-600 hover:text-blue-800">
                ← Back to Programs
              </a>
              <h1 className="text-xl font-bold text-gray-800">Create New Program</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        {/* School Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School *
          </label>
          {loadingSchools ? (
            <p className="text-gray-500 text-sm">Loading schools...</p>
          ) : (
            <select
              value={selectedSchoolId}
              onChange={e => setSelectedSchoolId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a school...</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>
                  {school.name} — {school.city}, {school.state}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedSchoolId && (
          <ProgramForm
            onSubmit={handleSubmit}
            loading={loading}
            submitLabel="Create Program"
            schoolId={selectedSchoolId}
          />
        )}

        {!selectedSchoolId && !loadingSchools && (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
            Select a school above to continue
          </div>
        )}
      </main>
    </div>
  );
}
