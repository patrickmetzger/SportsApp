'use client';

import { useState } from 'react';
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
  const [showAddChild, setShowAddChild] = useState(false);
  const [children, setChildren] = useState(initialChildren);

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

        {initialRegistrations.length === 0 ? (
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
            {initialRegistrations.map((registration) => (
              <div key={registration.id} className="bg-white rounded-xl p-6 shadow-card">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {registration.summer_programs.name}
                      </h3>
                      <PaymentStatusBadge status={registration.payment_status as any} />
                    </div>
                    <div className="space-y-1 text-sm text-slate-500">
                      <p>Student: {registration.student_name} ({registration.student_id})</p>
                      <p>
                        {new Date(registration.summer_programs.start_date).toLocaleDateString()} -{' '}
                        {new Date(registration.summer_programs.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

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
                        ${Number(registration.amount_paid || 0).toFixed(0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Balance</p>
                      <p className="text-lg font-semibold text-slate-900">
                        ${(Number(registration.amount_due || 0) - Number(registration.amount_paid || 0)).toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>

                {registration.payment_due_date && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                      Payment Due: <span className="font-medium text-slate-700">{new Date(registration.payment_due_date).toLocaleDateString()}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
