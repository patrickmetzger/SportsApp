'use client';

import { useState } from 'react';

interface AddChildFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddChildForm({ onSuccess, onCancel }: AddChildFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    student_id: '',
    date_of_birth: '',
    grade: '',
    gender: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/parent/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          grade: formData.grade ? parseInt(formData.grade) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add child');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 rounded-xl px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="first_name" className="block text-xs text-gray-400 font-medium mb-2">
            First Name *
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            required
            value={formData.first_name}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
            placeholder="John"
          />
        </div>

        <div>
          <label htmlFor="last_name" className="block text-xs text-gray-400 font-medium mb-2">
            Last Name *
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            required
            value={formData.last_name}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
            placeholder="Doe"
          />
        </div>
      </div>

      <div>
        <label htmlFor="student_id" className="block text-xs text-gray-400 font-medium mb-2">
          Student ID (optional)
        </label>
        <input
          id="student_id"
          name="student_id"
          type="text"
          value={formData.student_id}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
          placeholder="STU001"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="date_of_birth" className="block text-xs text-gray-400 font-medium mb-2">
            Date of Birth (optional)
          </label>
          <input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
          />
        </div>

        <div>
          <label htmlFor="grade" className="block text-xs text-gray-400 font-medium mb-2">
            Grade (optional)
          </label>
          <input
            id="grade"
            name="grade"
            type="number"
            min="1"
            max="12"
            value={formData.grade}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
            placeholder="9"
          />
        </div>
      </div>

      <div>
        <label htmlFor="gender" className="block text-xs text-gray-400 font-medium mb-2">
          Gender (optional)
        </label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
        >
          <option value="">Select gender...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-xs text-gray-400 font-medium mb-2">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors resize-none"
          placeholder="Any additional information..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-black text-white py-3 px-4 text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-gray-800 disabled:bg-gray-400 transition-all duration-300"
        >
          {loading ? 'Adding...' : 'Add Child'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white text-black py-3 px-4 text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-gray-50 transition-all duration-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
