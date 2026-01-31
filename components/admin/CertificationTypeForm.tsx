'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CertificationType {
  id?: string;
  name: string;
  description: string | null;
  is_universal: boolean;
  validity_period_months: number;
}

interface CertificationTypeFormProps {
  certificationType?: CertificationType | null;
  isSchoolAdmin?: boolean;
  returnUrl: string;
}

export default function CertificationTypeForm({
  certificationType,
  isSchoolAdmin = false,
  returnUrl,
}: CertificationTypeFormProps) {
  const router = useRouter();
  const isEditing = !!certificationType?.id;

  const [formData, setFormData] = useState({
    name: certificationType?.name || '',
    description: certificationType?.description || '',
    is_universal: certificationType?.is_universal || false,
    validity_period_months: certificationType?.validity_period_months || 12,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const baseUrl = isSchoolAdmin ? '/api/school-admin' : '/api/admin';
      const url = isEditing
        ? `${baseUrl}/certification-types/${certificationType.id}`
        : `${baseUrl}/certification-types`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(returnUrl);
        router.refresh();
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to save certification type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., CPR Certification, First Aid, Coaching License"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe the certification requirements..."
        />
      </div>

      <div>
        <label htmlFor="validity_period_months" className="block text-sm font-medium text-gray-700 mb-1">
          Validity Period (months)
        </label>
        <input
          type="number"
          id="validity_period_months"
          value={formData.validity_period_months}
          onChange={(e) => setFormData({ ...formData, validity_period_months: parseInt(e.target.value) || 12 })}
          min={1}
          max={120}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Default validity period for this certification type
        </p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_universal"
          checked={formData.is_universal}
          onChange={(e) => setFormData({ ...formData, is_universal: e.target.checked })}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="is_universal" className="ml-2 block text-sm text-gray-700">
          Universal certification (applies to all programs)
        </label>
      </div>
      <p className="text-sm text-gray-500 ml-6">
        When enabled, this certification will be required/recommended for all programs regardless of sport type.
      </p>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
        </button>
        <a
          href={returnUrl}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
