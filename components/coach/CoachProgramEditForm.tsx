'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/admin/ImageUpload';

interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  cost: number;
  header_image_url?: string;
  program_image_url?: string;
  min_grade?: number | null;
  max_grade?: number | null;
  min_age?: number | null;
  max_age?: number | null;
  gender_restriction?: string;
  eligibility_notes?: string;
  requirements?: any;
}

interface CoachProgramEditFormProps {
  program: Program;
  coachId: string;
}

export default function CoachProgramEditForm({ program, coachId }: CoachProgramEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: program.name,
    description: program.description || '',
    start_date: program.start_date,
    end_date: program.end_date,
    registration_deadline: program.registration_deadline,
    cost: program.cost,
    header_image_url: program.header_image_url || '',
    program_image_url: program.program_image_url || '',
    min_grade: program.min_grade?.toString() || '',
    max_grade: program.max_grade?.toString() || '',
    min_age: program.min_age?.toString() || '',
    max_age: program.max_age?.toString() || '',
    gender_restriction: program.gender_restriction || 'any',
    eligibility_notes: program.eligibility_notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cost' ? parseFloat(value) || 0 : value
    }));
  };

  const handleImageUpload = (field: 'header_image_url' | 'program_image_url') => (url: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: url
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate dates
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const deadline = new Date(formData.registration_deadline);

      if (endDate < startDate) {
        throw new Error('End date must be after start date');
      }

      if (deadline > startDate) {
        throw new Error('Registration deadline must be before start date');
      }

      const response = await fetch('/api/coach/programs/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: program.id,
          name: formData.name,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
          registration_deadline: formData.registration_deadline,
          cost: formData.cost,
          header_image_url: formData.header_image_url,
          program_image_url: formData.program_image_url,
          min_grade: formData.min_grade ? parseInt(formData.min_grade) : null,
          max_grade: formData.max_grade ? parseInt(formData.max_grade) : null,
          min_age: formData.min_age ? parseInt(formData.min_age) : null,
          max_age: formData.max_age ? parseInt(formData.max_age) : null,
          gender_restriction: formData.gender_restriction,
          eligibility_notes: formData.eligibility_notes,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update program');
      }

      router.push('/dashboard/coach');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 school-branded-card">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Program Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Program Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe the program..."
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="registration_deadline" className="block text-sm font-medium text-gray-700 mb-2">
            Registration Deadline *
          </label>
          <input
            type="date"
            id="registration_deadline"
            name="registration_deadline"
            value={formData.registration_deadline}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Cost */}
      <div>
        <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
          Program Cost ($) *
        </label>
        <input
          type="number"
          id="cost"
          name="cost"
          value={formData.cost}
          onChange={handleChange}
          min="0"
          step="0.01"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Eligibility Criteria */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Eligibility Criteria</h2>
        <p className="text-sm text-gray-600 mb-4">
          Set requirements for who can register for this program. Leave fields empty for no restriction.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="min_grade" className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Grade
            </label>
            <input
              type="number"
              id="min_grade"
              name="min_grade"
              value={formData.min_grade}
              onChange={handleChange}
              min="1"
              max="12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 9"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
          </div>

          <div>
            <label htmlFor="max_grade" className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Grade
            </label>
            <input
              type="number"
              id="max_grade"
              name="max_grade"
              value={formData.max_grade}
              onChange={handleChange}
              min="1"
              max="12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 12"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no maximum</p>
          </div>

          <div>
            <label htmlFor="min_age" className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Age
            </label>
            <input
              type="number"
              id="min_age"
              name="min_age"
              value={formData.min_age}
              onChange={handleChange}
              min="1"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 14"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
          </div>

          <div>
            <label htmlFor="max_age" className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Age
            </label>
            <input
              type="number"
              id="max_age"
              name="max_age"
              value={formData.max_age}
              onChange={handleChange}
              min="1"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 18"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no maximum</p>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="gender_restriction" className="block text-sm font-medium text-gray-700 mb-2">
              Gender Restriction
            </label>
            <select
              id="gender_restriction"
              name="gender_restriction"
              value={formData.gender_restriction}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="any">Any Gender</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="eligibility_notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Eligibility Notes
            </label>
            <textarea
              id="eligibility_notes"
              name="eligibility_notes"
              value={formData.eligibility_notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any other eligibility requirements or notes..."
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Header Image
            </label>
            <ImageUpload
              currentImageUrl={formData.header_image_url}
              onUploadComplete={handleImageUpload('header_image_url')}
              folder="headers"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program Card Image
            </label>
            <ImageUpload
              currentImageUrl={formData.program_image_url}
              onUploadComplete={handleImageUpload('program_image_url')}
              folder="programs"
            />
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 school-branded-btn-primary py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <a
          href="/dashboard/coach"
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-center"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
