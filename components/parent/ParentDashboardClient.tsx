'use client';

import { useState } from 'react';
import { CreditCardIcon, UserGroupIcon, CalendarIcon } from '@heroicons/react/24/outline';
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
      {/* Payment Summary Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <CreditCardIcon className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Payment Summary</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-blue-100 text-sm mb-1">Total Due</p>
            <p className="text-3xl font-bold">${paymentSummary.totalDue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1">Total Paid</p>
            <p className="text-3xl font-bold">${paymentSummary.totalPaid.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1">Outstanding Balance</p>
            <p className="text-3xl font-bold">${paymentSummary.outstanding.toFixed(2)}</p>
          </div>
        </div>
        {paymentSummary.outstanding > 0 && (
          <div className="mt-4 bg-blue-700 bg-opacity-50 rounded p-3">
            <p className="text-sm">
              You have an outstanding balance. Please make a payment to keep your registrations active.
            </p>
          </div>
        )}
      </div>

      {/* My Registrations Section */}
      <div id="registrations">
        <div className="flex items-center gap-3 mb-4">
          <CalendarIcon className="w-6 h-6 text-gray-700" />
          <h2 className="text-2xl font-bold text-gray-900">My Registrations</h2>
        </div>

        {initialRegistrations.length === 0 ? (
          <div className="clean-card p-8 text-center">
            <p className="text-gray-600">No registrations yet.</p>
            <a
              href="/programs"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Browse Summer Programs
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {initialRegistrations.map((registration) => (
              <div key={registration.id} className="clean-card p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {registration.summer_programs.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Student: {registration.student_name} ({registration.student_id})
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(registration.summer_programs.start_date).toLocaleDateString()} -{' '}
                      {new Date(registration.summer_programs.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <PaymentStatusBadge status={registration.payment_status as any} />
                    <p className="text-sm text-gray-600 mt-2">
                      Status:{' '}
                      <span className="font-medium capitalize">{registration.status}</span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Amount Due:</span>{' '}
                      <span className="font-semibold text-gray-900">
                        ${Number(registration.amount_due || 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount Paid:</span>{' '}
                      <span className="font-semibold text-gray-900">
                        ${Number(registration.amount_paid || 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Balance:</span>{' '}
                      <span className="font-semibold text-gray-900">
                        ${(Number(registration.amount_due || 0) - Number(registration.amount_paid || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {registration.payment_due_date && (
                    <p className="text-sm text-gray-600 mt-2">
                      Payment Due:{' '}
                      <span className="font-medium">
                        {new Date(registration.payment_due_date).toLocaleDateString()}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Children Section */}
      <div id="children">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <UserGroupIcon className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl font-bold text-gray-900">My Children</h2>
          </div>
          {!showAddChild && (
            <button
              onClick={() => setShowAddChild(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Add Child
            </button>
          )}
        </div>

        {showAddChild && (
          <div className="clean-card p-6 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Child</h3>
            <AddChildForm
              onSuccess={handleAddChildSuccess}
              onCancel={() => setShowAddChild(false)}
            />
          </div>
        )}

        <div className="clean-card p-6">
          <ChildrenList children={children} onRefresh={refreshChildren} />
        </div>
      </div>
    </div>
  );
}
