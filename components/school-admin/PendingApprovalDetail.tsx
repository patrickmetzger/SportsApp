'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserIcon,
  EnvelopeIcon,
  ClockIcon,
  DocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface Certification {
  id: string;
  certificate_number: string | null;
  issuing_organization: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  document_url: string | null;
  document_original_name: string | null;
  created_at: string;
  certification_type?: {
    id: string;
    name: string;
    description: string | null;
  };
}

interface Coach {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

interface Assistant {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  approval_status: string;
  rejected_reason: string | null;
  created_at: string;
  certifications: Certification[];
  invited_by_coach: Coach | null;
  invited_at: string | null;
}

interface PendingApprovalDetailProps {
  assistant: Assistant;
}

export default function PendingApprovalDetail({ assistant }: PendingApprovalDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this assistant coach?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/school-admin/pending-assistants/${assistant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve');
      }

      router.push('/school-admin/pending-approvals');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/school-admin/pending-assistants/${assistant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectReason }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject');
      }

      router.push('/school-admin/pending-approvals');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject assistant');
    } finally {
      setLoading(false);
      setShowRejectModal(false);
    }
  };

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isPending = assistant.approval_status === 'pending';
  const isRejected = assistant.approval_status === 'rejected';
  const isApproved = assistant.approval_status === 'approved';

  return (
    <>
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Assistant Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {assistant.first_name && assistant.last_name
                  ? `${assistant.first_name} ${assistant.last_name}`
                  : 'Name not set'}
              </h1>
              <div className="flex items-center gap-2 text-gray-500 mt-1">
                <EnvelopeIcon className="w-4 h-4" />
                <span>{assistant.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 mt-1">
                <ClockIcon className="w-4 h-4" />
                <span>Applied {new Date(assistant.created_at).toLocaleDateString()}</span>
              </div>
              {assistant.invited_by_coach && (
                <div className="mt-2 text-sm text-gray-600">
                  Invited by{' '}
                  <span className="font-medium">
                    {assistant.invited_by_coach.first_name} {assistant.invited_by_coach.last_name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end gap-3">
            {isPending && (
              <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full font-medium flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                Pending Approval
              </span>
            )}
            {isApproved && (
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5" />
                Approved
              </span>
            )}
            {isRejected && (
              <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-medium flex items-center gap-2">
                <XCircleIcon className="w-5 h-5" />
                Rejected
              </span>
            )}
          </div>
        </div>

        {/* Rejection Reason */}
        {isRejected && assistant.rejected_reason && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
            <p className="text-sm text-red-700">{assistant.rejected_reason}</p>
          </div>
        )}

        {/* Actions */}
        {isPending && (
          <div className="mt-6 pt-6 border-t border-gray-200 flex gap-4">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 md:flex-none bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              {loading ? 'Processing...' : 'Approve'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={loading}
              className="flex-1 md:flex-none bg-white border border-red-300 text-red-600 px-6 py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <XCircleIcon className="w-5 h-5" />
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Certifications Section */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DocumentCheckIcon className="w-5 h-5 text-gray-500" />
            Uploaded Certifications
          </h2>
          <span className="text-sm text-gray-500">
            {assistant.certifications.length} certification{assistant.certifications.length !== 1 ? 's' : ''}
          </span>
        </div>

        {assistant.certifications.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <ExclamationTriangleIcon className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No certifications uploaded yet</p>
            <p className="text-sm text-gray-500 mt-1">
              The assistant has not uploaded any certifications
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assistant.certifications.map((cert) => (
              <div
                key={cert.id}
                className={`border rounded-lg p-4 ${
                  isExpired(cert.expiration_date)
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {cert.certification_type?.name || 'Unknown Type'}
                      </h3>
                      {isExpired(cert.expiration_date) && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
                          Expired
                        </span>
                      )}
                    </div>

                    {cert.certification_type?.description && (
                      <p className="text-sm text-gray-500 mt-1">{cert.certification_type.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm">
                      {cert.certificate_number && (
                        <div>
                          <span className="text-gray-500">Certificate #:</span>{' '}
                          <span className="font-medium text-gray-900">{cert.certificate_number}</span>
                        </div>
                      )}
                      {cert.issuing_organization && (
                        <div>
                          <span className="text-gray-500">Issuer:</span>{' '}
                          <span className="font-medium text-gray-900">{cert.issuing_organization}</span>
                        </div>
                      )}
                      {cert.issue_date && (
                        <div>
                          <span className="text-gray-500">Issued:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {new Date(cert.issue_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {cert.expiration_date && (
                        <div>
                          <span className="text-gray-500">Expires:</span>{' '}
                          <span className={`font-medium ${
                            isExpired(cert.expiration_date) ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {new Date(cert.expiration_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {cert.document_url && (
                    <a
                      href={cert.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-1 whitespace-nowrap"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Document
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject this assistant coach application?
              You can optionally provide a reason.
            </p>

            <div className="mb-4">
              <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="Enter a reason for rejection..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? 'Rejecting...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
