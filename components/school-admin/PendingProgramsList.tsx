'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface PendingProgram {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  cost: number;
  submitted_by_name: string;
  created_at: string;
}

interface PendingProgramsListProps {
  programs: PendingProgram[];
}

export default function PendingProgramsList({ programs }: PendingProgramsListProps) {
  const router = useRouter();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  if (programs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-card p-8 text-center">
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <ClipboardDocumentListIcon className="w-6 h-6 text-green-500" />
        </div>
        <p className="text-gray-500 text-sm">No pending program submissions.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const handleApprove = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/school-admin/programs/${id}/approve`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to approve program');
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/school-admin/programs/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to reject program');
        return;
      }
      setRejectingId(null);
      setRejectReason('');
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Program
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Coach
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Dates
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Cost
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {programs.map((program) => (
            <React.Fragment key={program.id}>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{program.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted {formatDate(program.created_at)}
                  </p>
                </td>
                <td className="px-6 py-4 text-gray-600">{program.submitted_by_name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span>
                      {formatDate(program.start_date)} – {formatDate(program.end_date)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  ${Number(program.cost).toFixed(0)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleApprove(program.id)}
                      disabled={loading === program.id}
                      className="px-3 py-1.5 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors"
                    >
                      {loading === program.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(program.id);
                        setRejectReason('');
                      }}
                      disabled={loading === program.id}
                      className="px-3 py-1.5 bg-white border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
              {rejectingId === program.id && (
                <tr className="bg-red-50">
                  <td colSpan={5} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-red-800 mb-1">
                          Rejection reason (optional)
                        </label>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. Dates conflict with existing program"
                          className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2 pt-6">
                        <button
                          onClick={() => handleReject(program.id)}
                          disabled={loading === program.id}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {loading === program.id ? '...' : 'Confirm Reject'}
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
