'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCardIcon, UserGroupIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PaymentStatusBadge from './PaymentStatusBadge';
import ChildrenList from './ChildrenList';
import AddChildForm from './AddChildForm';

interface Registration {
  id: string;
  program_id: string;
  student_name: string;
  student_id: string;
  status: string;
  payment_status: string;
  amount_due: number;
  amount_paid: number;
  payment_due_date?: string;
  created_at: string;
  summer_programs: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
}

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  student_id?: string;
  date_of_birth?: string;
  grade?: number;
  notes?: string;
}

interface PaymentSummary {
  totalDue: number;
  totalPaid: number;
  outstanding: number;
}

interface ParentDashboardClientProps {
  initialRegistrations: Registration[];
  initialChildren: Child[];
  paymentSummary: PaymentSummary;
}

export default function ParentDashboardClient({
  initialRegistrations,
  initialChildren,
  paymentSummary,
}: ParentDashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnTo = searchParams.get('returnTo');

  const [showAddChild, setShowAddChild] = useState(searchParams.get('addChild') === '1');
  const [children, setChildren] = useState(initialChildren);
  const [registrations, setRegistrations] = useState(initialRegistrations);

  // Cancel / refund state
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [refundModal, setRefundModal] = useState<{ id: string; amount: number } | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const refreshChildren = async () => {
    try {
      const response = await fetch('/api/parent/children');
      const data = await response.json();
      if (data.children) {
        setChildren(data.children);
      }
    } catch (error) {
      console.error('Failed to refresh children:', error);
    }
  };

  const handleAddChildSuccess = () => {
    setShowAddChild(false);
    refreshChildren();
    if (returnTo) {
      router.push(returnTo);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    setCancellingId(id);
    setActionError('');
    try {
      const res = await fetch(`/api/parent/registrations/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setRegistrations((prev) =>
          prev.map((r) => r.id === id ? { ...r, status: 'cancelled' } : r)
        );
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to cancel');
      }
    } finally {
      setCancellingId(null);
    }
  };

  const handleRefundSubmit = async () => {
    if (!refundModal) return;
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`/api/parent/registrations/${refundModal.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: refundReason }),
      });
      if (res.ok) {
        setRegistrations((prev) =>
          prev.map((r) => r.id === refundModal.id ? { ...r, status: 'refund_requested' } : r)
        );
        setRefundModal(null);
        setRefundReason('');
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to submit refund request');
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Payment Summary */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Due</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">${paymentSummary.totalDue.toFixed(0)}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <CreditCardIcon className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Paid</p>
                <p className="text-2xl font-bold text-teal-600 mt-1">${paymentSummary.totalPaid.toFixed(0)}</p>
              </div>
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                <CreditCardIcon className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-6 shadow-card ${paymentSummary.outstanding > 0 ? 'bg-amber-50' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Outstanding</p>
                <p className={`text-2xl font-bold mt-1 ${paymentSummary.outstanding > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  ${paymentSummary.outstanding.toFixed(0)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentSummary.outstanding > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
                <CreditCardIcon className={`w-6 h-6 ${paymentSummary.outstanding > 0 ? 'text-amber-600' : 'text-slate-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {paymentSummary.outstanding > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              You have an outstanding balance. Please make a payment to keep your registrations active.
            </p>
          </div>
        )}
      </div>

      {/* My Registrations Section */}
      <div id="registrations">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">My Registrations</h2>

        {actionError && (
          <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{actionError}</div>
        )}

        {registrations.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-card">
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Registrations Yet</h3>
            <p className="text-sm text-slate-500 mb-6">
              Explore our available programs and register today.
            </p>
            <a
              href="/programs"
              className="inline-block px-6 py-3 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors"
            >
              Browse Programs
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((registration) => {
              const amountPaid = Number(registration.amount_paid || 0);
              const isCancelled = registration.status === 'cancelled';
              const isRefundRequested = registration.status === 'refund_requested';
              const canCancel = !isCancelled && !isRefundRequested;

              return (
                <div
                  key={registration.id}
                  className={`bg-white rounded-xl p-6 shadow-card ${isCancelled || isRefundRequested ? 'opacity-60' : ''}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {registration.summer_programs.name}
                        </h3>
                        <PaymentStatusBadge status={registration.payment_status as any} />
                        {isCancelled && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full">Cancelled</span>
                        )}
                        {isRefundRequested && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">Refund Requested</span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-slate-500">
                        <p>Student: {registration.student_name} ({registration.student_id})</p>
                        <p>
                          {new Date(registration.summer_programs.start_date).toLocaleDateString()} -{' '}
                          {new Date(registration.summer_programs.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {!(isCancelled && amountPaid === 0) && (
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-slate-400 mb-1">Due</p>
                          <p className="text-lg font-semibold text-slate-900">
                            ${Number(registration.amount_due || 0).toFixed(0)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400 mb-1">Paid</p>
                          <p className="text-lg font-semibold text-teal-600">
                            ${amountPaid.toFixed(0)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400 mb-1">Balance</p>
                          <p className="text-lg font-semibold text-slate-900">
                            ${(Number(registration.amount_due || 0) - amountPaid).toFixed(0)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                    {registration.payment_due_date && !(isCancelled && amountPaid === 0) && (
                      <p className="text-sm text-slate-500">
                        Payment Due: <span className="font-medium text-slate-700">{new Date(registration.payment_due_date).toLocaleDateString()}</span>
                      </p>
                    )}
                    {canCancel && (
                      <div className="ml-auto">
                        {amountPaid === 0 ? (
                          <button
                            onClick={() => handleCancel(registration.id)}
                            disabled={cancellingId === registration.id}
                            className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                          >
                            {cancellingId === registration.id ? 'Cancelling…' : 'Cancel Registration'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setRefundModal({ id: registration.id, amount: amountPaid });
                              setRefundReason('');
                              setActionError('');
                            }}
                            className="text-sm text-amber-600 hover:text-amber-800 font-medium"
                          >
                            Request Refund
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Refund Request Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Request a Refund</h3>
            <p className="text-sm text-slate-500 mb-4">
              You paid <span className="font-semibold text-slate-700">${refundModal.amount.toFixed(2)}</span>. A refund request will be sent to the administrator for review.
            </p>

            {actionError && (
              <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{actionError}</div>
            )}

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for refund <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Please explain why you're requesting a refund…"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none mb-5"
            />

            <div className="flex gap-3">
              <button
                onClick={handleRefundSubmit}
                disabled={actionLoading}
                className="flex-1 bg-amber-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition"
              >
                {actionLoading ? 'Submitting…' : 'Submit Refund Request'}
              </button>
              <button
                onClick={() => { setRefundModal(null); setActionError(''); }}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Children Section */}
      <div id="children">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">My Children</h2>
          {!showAddChild && (
            <button
              onClick={() => setShowAddChild(true)}
              className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
            >
              Add Child
            </button>
          )}
        </div>

        {showAddChild && (
          <div className="bg-white rounded-xl p-6 shadow-card mb-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Child</h3>
            <AddChildForm
              onSuccess={handleAddChildSuccess}
              onCancel={() => setShowAddChild(false)}
            />
          </div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-card">
          <ChildrenList children={children} onRefresh={refreshChildren} />
        </div>
      </div>
    </div>
  );
}
