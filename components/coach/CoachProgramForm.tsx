'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/admin/ImageUpload';

interface CoachProgramFormProps {
  mode: 'create' | 'edit';
  program?: {
    id: string;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    registration_deadline: string;
    cost: number;
    header_image_url?: string | null;
    program_image_url?: string | null;
  };
}

export default function CoachProgramForm({ mode, program }: CoachProgramFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(program?.name || '');
  const [description, setDescription] = useState(program?.description || '');
  const [startDate, setStartDate] = useState(
    program?.start_date ? program.start_date.split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    program?.end_date ? program.end_date.split('T')[0] : ''
  );
  const [deadline, setDeadline] = useState(
    program?.registration_deadline ? program.registration_deadline.split('T')[0] : ''
  );
  const [cost, setCost] = useState(program?.cost?.toString() || '');
  const [headerImageUrl, setHeaderImageUrl] = useState(program?.header_image_url || '');
  const [programImageUrl, setProgramImageUrl] = useState(program?.program_image_url || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = mode === 'create'
        ? '/api/coach/programs'
        : `/api/coach/programs/${program!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          start_date: startDate,
          end_date: endDate,
          registration_deadline: deadline,
          cost: parseFloat(cost),
          header_image_url: headerImageUrl || null,
          program_image_url: programImageUrl || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${mode} program`);

      router.push('/dashboard/coach');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Basketball Summer Camp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Describe the program..."
              />
            </div>
          </div>
        </div>

        {/* Dates & Cost */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Dates & Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Deadline *
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost (USD) *
              </label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="299.99"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header Image
              </label>
              <ImageUpload
                currentImageUrl={headerImageUrl}
                onUploadComplete={setHeaderImageUrl}
                folder="headers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Card Image
              </label>
              <ImageUpload
                currentImageUrl={programImageUrl}
                onUploadComplete={setProgramImageUrl}
                folder="programs"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-teal-500 text-white py-3 rounded-lg disabled:bg-gray-400 transition font-semibold hover:bg-teal-600"
          >
            {loading
              ? 'Submitting...'
              : mode === 'create'
              ? 'Submit for Approval'
              : 'Resubmit for Approval'}
          </button>
          <Link
            href="/dashboard/coach"
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition text-center font-semibold flex items-center justify-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
