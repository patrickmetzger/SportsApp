'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  school_id?: string;
}

interface School {
  id: string;
  name: string;
}

interface BulkAssignCoachesProps {
  school: School;
  onClose: () => void;
}

export default function BulkAssignCoaches({ school, onClose }: BulkAssignCoachesProps) {
  const router = useRouter();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const response = await fetch('/api/admin/coaches');
        if (response.ok) {
          const data = await response.json();
          const allCoaches = data.coaches || [];
          setCoaches(allCoaches);

          // Pre-select coaches already assigned to this school
          const assignedCoachIds = allCoaches
            .filter((coach: Coach) => coach.school_id === school.id)
            .map((coach: Coach) => coach.id);
          setSelectedCoachIds(assignedCoachIds);
        }
      } catch (error) {
        console.error('Failed to fetch coaches:', error);
        setError('Failed to load coaches');
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, [school.id]);

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
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/schools/${school.id}/assign-coaches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach_ids: selectedCoachIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign coaches');
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Only show coaches assigned to this school or unassigned coaches
  const coachesWithSchool = coaches.filter((c) => c.school_id === school.id);
  const coachesWithoutSchool = coaches.filter((c) => !c.school_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Assign Coaches</h2>
            <p className="text-gray-600 mt-1">
              Select coaches to assign to {school.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading coaches...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Currently Assigned */}
              {coachesWithSchool.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Currently Assigned to This School ({coachesWithSchool.length})
                  </h3>
                  <div className="space-y-2">
                    {coachesWithSchool.map((coach) => (
                      <label
                        key={coach.id}
                        className="flex items-center p-3 border-2 border-blue-300 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCoachIds.includes(coach.id)}
                          onChange={() => toggleCoach(coach.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {coach.first_name} {coach.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{coach.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Unassigned Coaches */}
              {coachesWithoutSchool.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Unassigned Coaches ({coachesWithoutSchool.length})
                  </h3>
                  <div className="space-y-2">
                    {coachesWithoutSchool.map((coach) => (
                      <label
                        key={coach.id}
                        className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCoachIds.includes(coach.id)}
                          onChange={() => toggleCoach(coach.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {coach.first_name} {coach.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{coach.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {coachesWithSchool.length === 0 && coachesWithoutSchool.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No coaches available. All coaches are assigned to other schools.
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
              >
                {saving ? 'Saving...' : `Assign ${selectedCoachIds.length} Coach${selectedCoachIds.length !== 1 ? 'es' : ''}`}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
