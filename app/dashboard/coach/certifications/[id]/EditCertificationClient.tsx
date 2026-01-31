'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CertificationType {
  id: string;
  name: string;
}

interface Certification {
  id: string;
  certification_type_id: string;
  certificate_number: string | null;
  issuing_organization: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  document_url: string | null;
  document_original_name: string | null;
  certification_type?: CertificationType;
}

interface EditCertificationClientProps {
  certification: Certification;
}

export default function EditCertificationClient({ certification }: EditCertificationClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    certificate_number: certification.certificate_number || '',
    issuing_organization: certification.issuing_organization || '',
    issue_date: certification.issue_date || '',
    expiration_date: certification.expiration_date || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/coach/certifications/${certification.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update');
      }

      router.push('/dashboard/coach/certifications');
      router.refresh();
    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update');
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

      {/* Certification Type (read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Certification Type
        </label>
        <input
          type="text"
          value={certification.certification_type?.name || 'Unknown'}
          disabled
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
        />
      </div>

      {/* Document preview */}
      {certification.document_url && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document
          </label>
          <div className="flex items-center gap-2">
            <a
              href={certification.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Document
            </a>
            <span className="text-gray-400 text-sm">
              ({certification.document_original_name || 'uploaded file'})
            </span>
          </div>
        </div>
      )}

      {/* Certificate Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="certificate_number" className="block text-sm font-medium text-gray-700 mb-1">
            Certificate Number
          </label>
          <input
            type="text"
            id="certificate_number"
            value={formData.certificate_number}
            onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="issuing_organization" className="block text-sm font-medium text-gray-700 mb-1">
            Issuing Organization
          </label>
          <input
            type="text"
            id="issuing_organization"
            value={formData.issuing_organization}
            onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Date
          </label>
          <input
            type="date"
            id="issue_date"
            value={formData.issue_date}
            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="expiration_date" className="block text-sm font-medium text-gray-700 mb-1">
            Expiration Date
          </label>
          <input
            type="date"
            id="expiration_date"
            value={formData.expiration_date}
            onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <a
          href="/dashboard/coach/certifications"
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
