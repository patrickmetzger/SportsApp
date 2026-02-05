'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CertificationType {
  id: string;
  name: string;
  description: string | null;
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
  created_at: string;
  certification_type?: CertificationType;
}

interface AssistantCertificationsListProps {
  certifications: Certification[];
}

export default function AssistantCertificationsList({ certifications }: AssistantCertificationsListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch(`/api/coach/certifications/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const expirationDate = new Date(date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expirationDate <= thirtyDaysFromNow && expirationDate > new Date();
  };

  if (certifications.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-card">
        <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No certifications yet</h3>
        <p className="mt-1 text-gray-500">Get started by uploading your first certification.</p>
        <a
          href="/dashboard/assistant/certifications/upload"
          className="mt-4 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
        >
          Upload Certification
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {certifications.map((cert) => (
        <div
          key={cert.id}
          className={`bg-white rounded-xl shadow-card overflow-hidden ${
            isExpired(cert.expiration_date)
              ? 'border-2 border-red-200'
              : isExpiringSoon(cert.expiration_date)
              ? 'border-2 border-amber-200'
              : ''
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {cert.certification_type?.name || 'Certification'}
                </h3>
                {cert.issuing_organization && (
                  <p className="text-sm text-gray-500 truncate">{cert.issuing_organization}</p>
                )}
              </div>
              {isExpired(cert.expiration_date) && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                  Expired
                </span>
              )}
              {isExpiringSoon(cert.expiration_date) && !isExpired(cert.expiration_date) && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                  Expiring Soon
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-4 space-y-2">
            {cert.certificate_number && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Certificate #:</span>
                <span className="font-medium text-gray-900">{cert.certificate_number}</span>
              </div>
            )}
            {cert.issue_date && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Issued:</span>
                <span className="text-gray-900">
                  {new Date(cert.issue_date).toLocaleDateString()}
                </span>
              </div>
            )}
            {cert.expiration_date && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Expires:</span>
                <span className={`${isExpired(cert.expiration_date) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                  {new Date(cert.expiration_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            {cert.document_url && (
              <a
                href={cert.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View
              </a>
            )}
            <button
              onClick={() => handleDelete(cert.id)}
              disabled={deleting === cert.id}
              className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 flex items-center gap-1"
            >
              {deleting === cert.id ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
