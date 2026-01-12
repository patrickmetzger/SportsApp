'use client';

import { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import { json } from 'zod';

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ProgramFormProps {
  program?: any;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  submitLabel: string;
}

export default function ProgramForm({
  program,
  onSubmit,
  loading,
  submitLabel,
}: ProgramFormProps) {
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
  const [requirements, setRequirements] = useState<string[]>(
    program?.requirements || []
  );
  const [newRequirement, setNewRequirement] = useState('');
  const [headerImageUrl, setHeaderImageUrl] = useState(program?.header_image_url || '');
  const [programImageUrl, setProgramImageUrl] = useState(program?.program_image_url || '');
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>(
    program?.program_coaches?.map((c: any) => c.coach_id) || []
  );
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [minGrade, setMinGrade] = useState(program?.min_grade?.toString() || '');
  const [maxGrade, setMaxGrade] = useState(program?.max_grade?.toString() || '');
  const [minAge, setMinAge] = useState(program?.min_age?.toString() || '');
  const [maxAge, setMaxAge] = useState(program?.max_age?.toString() || '');
  const [genderRestriction, setGenderRestriction] = useState(program?.gender_restriction || 'any');
  const [eligibilityNotes, setEligibilityNotes] = useState(program?.eligibility_notes || '');

  // Fetch available coaches
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const response = await fetch('/api/admin/coaches');
        if (response.ok) {
          const data = await response.json();
          setCoaches(data.coaches || []);
        }
      } catch (error) {
        console.error('Failed to fetch coaches:', error);
      } finally {
        setLoadingCoaches(false);
      }
    };

    fetchCoaches();
  }, []);

  const toggleCoach = (coachId: string) => {
    setSelectedCoachIds(prev =>
      prev.includes(coachId)
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId]
    );
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await onSubmit({
      id: program?.id,
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      registration_deadline: deadline,
      cost: parseFloat(cost),
      requirements,
      header_image_url: headerImageUrl,
      program_image_url: programImageUrl,
      coach_ids: selectedCoachIds,
      min_grade: minGrade ? parseInt(minGrade) : null,
      max_grade: maxGrade ? parseInt(maxGrade) : null,
      min_age: minAge ? parseInt(minAge) : null,
      max_age: maxAge ? parseInt(maxAge) : null,
      gender_restriction: genderRestriction,
      eligibility_notes: eligibilityNotes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Basic Info */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Basic Information
        </h2>

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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              title='startDate'
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              title='endDate'
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Deadline *
            </label>
            <input
              type="date"
              title="deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="299.99"
            />
          </div>
        </div>
      </div>

      {/* Eligibility Criteria */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Eligibility Criteria</h2>
        <p className="text-sm text-gray-600 mb-4">
          Set requirements for who can register for this program. Leave fields empty for no restriction.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Grade
            </label>
            <input
              type="number"
              value={minGrade}
              onChange={(e) => setMinGrade(e.target.value)}
              min="1"
              max="12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 9"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Grade
            </label>
            <input
              type="number"
              value={maxGrade}
              onChange={(e) => setMaxGrade(e.target.value)}
              min="1"
              max="12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 12"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no maximum</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Age
            </label>
            <input
              type="number"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
              min="1"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 14"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Age
            </label>
            <input
              type="number"
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              min="1"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 18"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no maximum</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender Restriction
            </label>
            <select
              title="genderRestriction"
              value={genderRestriction}
              onChange={(e) => setGenderRestriction(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="any">Any Gender</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Eligibility Notes
            </label>
            <textarea
              value={eligibilityNotes}
              onChange={(e) => setEligibilityNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any other eligibility requirements or notes..."
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Images</h2>

        <div className="space-y-4">
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

      {/* Requirements */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a requirement..."
            />
            <button
              type="button"
              onClick={addRequirement}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          {requirements.length > 0 && (
            <ul className="space-y-2">
              {requirements.map((req, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <span className="text-gray-700">{req}</span>
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Coaches */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Assign Coaches</h2>

        {loadingCoaches ? (
          <p className="text-gray-600">Loading coaches...</p>
        ) : coaches.length === 0 ? (
          <p className="text-gray-600">No coaches available. Create coach users first.</p>
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
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
          {selectedCoachIds.length}
          Selected: {selectedCoachIds.length} coach{selectedCoachIds.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
        <a
          href="/admin/programs"
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition text-center font-semibold"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
