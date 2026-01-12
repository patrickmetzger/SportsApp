'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface SchoolAdminProgramFormProps {
  schoolId: string;
  coaches: Coach[];
  mode: 'create' | 'edit';
  program?: any;
}

export default function SchoolAdminProgramForm({
  schoolId,
  coaches,
  mode,
  program,
}: SchoolAdminProgramFormProps) {
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
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>(
    program?.program_coaches?.map((c: any) => c.coach_id) || []
  );

  const toggleCoach = (coachId: string) => {
    setSelectedCoachIds((prev) =>
      prev.includes(coachId)
        ? prev.filter((id) => id !== coachId)
        : [...prev, coachId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = mode === 'create' ? '/api/admin/programs/create' : '/api/admin/programs/update';
      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: program?.id,
          name,
          description,
          start_date: startDate,
          end_date: endDate,
          registration_deadline: deadline,
          cost: parseFloat(cost),
          coach_ids: selectedCoachIds,
          school_id: schoolId,
          requirements: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${mode} program`);
      }

      router.push('/school-admin/programs');
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="299.99"
              />
            </div>
          </div>
        </div>

        {/* Coaches */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Assign Coaches</h2>

          {coaches.length === 0 ? (
            <p className="text-gray-600">No coaches available at your school. Create coach users first.</p>
          ) : (
            <div className="space-y-2">
              {coaches.map((coach) => (
                <label
                  key={coach.id}
                  className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCoachIds.includes(coach.id)}
                    onChange={() => toggleCoach(coach.id)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="ml-3 text-gray-900">
                    {coach.first_name} {coach.last_name}
                    <span className="text-gray-500 text-sm ml-2">({coach.email})</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-600 mt-2">
            Selected: {selectedCoachIds.length} coach{selectedCoachIds.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 school-btn-primary py-3 rounded-lg disabled:bg-gray-400 transition font-semibold"
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create Program' : 'Save Changes'}
          </button>
          <a
            href="/school-admin/programs"
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition text-center font-semibold flex items-center justify-center"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
