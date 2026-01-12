'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgramForm from '@/components/admin/ProgramForm';

export default function NewProgramPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/programs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
                Create New Program
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
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Create Program"
        />
      </main>
    </div>
  );
}
