'use client';

import { ClockIcon, DocumentCheckIcon, UserIcon } from '@heroicons/react/24/outline';

interface PendingAssistant {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  certification_count: number;
  invited_by: string | null;
}

interface PendingApprovalsListProps {
  pendingAssistants: PendingAssistant[];
}

export default function PendingApprovalsList({ pendingAssistants }: PendingApprovalsListProps) {
  if (pendingAssistants.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-card p-12 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
        <p className="text-gray-500">
          There are no pending assistant coach approvals at this time.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Assistant
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Invited By
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Certifications
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Applied
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pendingAssistants.map((assistant) => (
              <tr key={assistant.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {assistant.first_name && assistant.last_name
                          ? `${assistant.first_name} ${assistant.last_name}`
                          : 'Name not set'}
                      </p>
                      <p className="text-sm text-gray-500">{assistant.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-600">
                    {assistant.invited_by || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <DocumentCheckIcon className="w-4 h-4 text-gray-400" />
                    <span className={`font-medium ${
                      assistant.certification_count > 0 ? 'text-teal-600' : 'text-gray-400'
                    }`}>
                      {assistant.certification_count} uploaded
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <ClockIcon className="w-4 h-4" />
                    <span className="text-sm">{formatDate(assistant.created_at)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <a
                    href={`/school-admin/pending-approvals/${assistant.id}`}
                    className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium text-sm"
                  >
                    Review
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
