'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgramForm from '@/components/admin/ProgramForm';
import ProgramCertificationRequirements from '@/components/admin/ProgramCertificationRequirements';

export default function EditProgramClient({ program }: { program: any }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/programs/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update program');
      }

      router.push('/admin/programs');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b-2 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <a href="/admin/programs" className="text-blue-600 hover:text-blue-800">
                ← Back to Programs
              </a>
              <h1 className="text-xl font-bold text-gray-800">
                Edit Program
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <ProgramForm
          program={program}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Update Program"
        />

        {/* Certification Requirements Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Certification Requirements
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Select which certifications coaches must have to work with this program.
          </p>
          <ProgramCertificationRequirements
            programId={program.id}
            isSchoolAdmin={false}
          />
        </div>
      </main>
    </div>
  );
}
