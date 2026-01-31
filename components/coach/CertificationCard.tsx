'use client';

import { getCertificationStatus, formatCertificationStatus, getDaysUntilExpiry } from '@/lib/certifications';

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

interface CertificationCardProps {
  certification: Certification;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

export default function CertificationCard({
  certification,
  onDelete,
  deleting,
}: CertificationCardProps) {
  const status = getCertificationStatus(certification.expiration_date);
  const statusDisplay = formatCertificationStatus(status);
  const daysUntil = getDaysUntilExpiry(certification.expiration_date);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">
              {certification.certification_type?.name || 'Unknown Type'}
            </h3>
            {certification.issuing_organization && (
              <p className="text-sm text-gray-500">{certification.issuing_organization}</p>
            )}
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
            {statusDisplay.label}
          </span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Certificate #:</span>
            <span className="ml-1 text-gray-900">{certification.certificate_number || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Issue Date:</span>
            <span className="ml-1 text-gray-900">{formatDate(certification.issue_date)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Expiration:</span>
            <span className="ml-1 text-gray-900">
              {formatDate(certification.expiration_date)}
              {daysUntil !== null && (
                <span className={`ml-2 ${daysUntil < 0 ? 'text-red-600' : daysUntil <= 30 ? 'text-yellow-600' : 'text-gray-500'}`}>
                  ({daysUntil < 0 ? `${Math.abs(daysUntil)} days ago` : daysUntil === 0 ? 'Today' : `${daysUntil} days`})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Document link */}
        {certification.document_url && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <a
              href={certification.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Document
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex gap-3">
        <a
          href={`/dashboard/coach/certifications/${certification.id}`}
          className="text-sm text-teal-600 hover:text-teal-700"
        >
          Edit
        </a>
        {onDelete && (
          <button
            onClick={() => onDelete(certification.id)}
            disabled={deleting}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
}
