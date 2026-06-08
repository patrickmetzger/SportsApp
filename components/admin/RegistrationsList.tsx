'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Registration {
  id: string;
  student_name: string;
  student_id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  summer_programs: {
    id: string;
    name: string;
  };
}

export default function RegistrationsList({
  registrations,
}: {
  registrations: Registration[] | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/admin/registrations/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredRegistrations =
    filter === 'all'
      ? registrations
      : registrations?.filter((r) => r.status === filter);

  return (
    <div>
      {/* Filter Tabs */}
      <div className="px-6 py-3 border-b border-gray-200 flex gap-4">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg capitalize font-medium transition ${
              filter === f
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f}
            {registrations && (
              <span className="ml-2 text-sm">
                (
                {f === 'all'
                  ? registrations.length
                  : registrations.filter((r) => r.status === f).length}
                )
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile card view */}
      <div className="lg:hidden space-y-3 px-4 py-4">
        {filteredRegistrations?.map((reg) => (
          <div key={reg.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-gray-900">{reg.student_name}</div>
                <div className="text-xs text-gray-500">{reg.student_id}</div>
              </div>
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>{reg.status}</span>
            </div>
            <div className="text-sm text-gray-500">{reg.summer_programs.name}</div>
            <div className="text-sm">
              <div className="text-gray-900">{reg.parent_name}</div>
              <div className="text-gray-500">{reg.parent_email}</div>
              <div className="text-gray-500">{reg.parent_phone}</div>
            </div>
            <div className="text-xs text-gray-400">{new Date(reg.created_at).toLocaleDateString()}</div>
            {reg.status === 'pending' && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-gray-100">
                <button onClick={() => updateStatus(reg.id, 'approved')} className="text-sm text-green-600 hover:text-green-900">Approve</button>
                <button onClick={() => updateStatus(reg.id, 'rejected')} className="text-sm text-red-600 hover:text-red-900">Reject</button>
              </div>
            )}
          </div>
        ))}
        {(!filteredRegistrations || filteredRegistrations.length === 0) && (
          <div className="p-6 text-center text-gray-500">No registrations found</div>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Program
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Parent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRegistrations?.map((reg) => (
              <tr key={reg.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {reg.student_name}
                  </div>
                  <div className="text-sm text-gray-500">{reg.student_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {reg.summer_programs.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {reg.parent_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="text-gray-900">{reg.parent_email}</div>
                  <div className="text-gray-500">{reg.parent_phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                <td className="px-6 py-4 text-sm font-medium">
                  {reg.status === 'pending' && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <button
                        onClick={() => updateStatus(reg.id, 'approved')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(reg.id, 'rejected')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filteredRegistrations || filteredRegistrations.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No registrations found
          </div>
        ) : null}
      </div>
    </div>
  );
}
