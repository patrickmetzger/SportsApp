'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ManualRegistrationForm from './ManualRegistrationForm';

interface Registration {
  id: string;
  student_name: string;
  student_id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  status: string;
  payment_status: string;
  amount_due: number;
  amount_paid: number;
  payment_due_date?: string;
  notes?: string;
  created_at: string;
}

interface ProgramRegistrationsClientProps {
  programId: string;
  programName: string;
  programCost: number;
  initialRegistrations: Registration[];
}

export default function ProgramRegistrationsClient({
  programId,
  programName,
  programCost,
  initialRegistrations,
}: ProgramRegistrationsClientProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);

  const pending = initialRegistrations.filter((r) => r.status === 'pending');
  const approved = initialRegistrations.filter((r) => r.status === 'approved');
  const rejected = initialRegistrations.filter((r) => r.status === 'rejected');

  const handleSuccess = () => {
    setShowAddForm(false);
    setEditingRegistration(null);
    router.refresh();
  };

  const handleDelete = async (id: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete the registration for ${studentName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/registrations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete registration');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {programName} - Registrations
            </h1>
            <p className="text-gray-600">
              Total: {initialRegistrations.length} registrations
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Add Registration
          </button>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingRegistration) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingRegistration ? 'Edit Registration' : 'Add Manual Registration'}
            </h2>
            <ManualRegistrationForm
              programId={programId}
              programCost={programCost}
              registration={editingRegistration}
              onSuccess={handleSuccess}
              onCancel={() => {
                setShowAddForm(false);
                setEditingRegistration(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-900">{pending.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Approved</h3>
          <p className="text-3xl font-bold text-green-900">{approved.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Rejected</h3>
          <p className="text-3xl font-bold text-red-900">{rejected.length}</p>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {initialRegistrations.length > 0 ? (
              initialRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reg.student_name}
                      </div>
                      <div className="text-sm text-gray-500">{reg.student_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reg.parent_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reg.parent_email}</div>
                    <div className="text-sm text-gray-500">{reg.parent_phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          reg.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : reg.payment_status === 'partial'
                            ? 'bg-blue-100 text-blue-800'
                            : reg.payment_status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {reg.payment_status || 'pending'}
                      </span>
                      <div className="mt-1 text-xs text-gray-500">
                        ${Number(reg.amount_paid || 0).toFixed(2)} / $
                        {Number(reg.amount_due || 0).toFixed(2)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        reg.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : reg.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {reg.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(reg.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => setEditingRegistration(reg)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(reg.id, reg.student_name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No registrations yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
