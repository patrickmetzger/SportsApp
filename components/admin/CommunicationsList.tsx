'use client';

import { useState } from 'react';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Communication {
  id: string;
  sender: User | null;
  recipient_ids: string[];
  recipient_type: string;
  school_id?: string;
  subject: string;
  message: string;
  delivery_method: string;
  status: string;
  sent_at?: string;
  created_at: string;
}

interface CommunicationsListProps {
  communications: Communication[];
}

export default function CommunicationsList({ communications }: CommunicationsListProps) {
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      sent: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRecipientTypeLabel = (type: string) => {
    const labels = {
      individual: 'Individual',
      school_coaches: 'School Coaches',
      all_coaches: 'All Coaches',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getDeliveryMethodBadge = (method: string) => {
    const styles = {
      email: 'bg-blue-100 text-blue-800',
      sms: 'bg-purple-100 text-purple-800',
      both: 'bg-indigo-100 text-indigo-800',
    };

    const labels = {
      email: 'Email',
      sms: 'SMS',
      both: 'Email + SMS',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[method as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[method as keyof typeof labels] || method}
      </span>
    );
  };

  if (communications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No communications sent yet</p>
        <p className="text-sm mt-2">Click "Send Communication" to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Sent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sender
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recipients
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {communications.map((comm) => (
              <tr key={comm.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {comm.sent_at ? formatDate(comm.sent_at) : formatDate(comm.created_at)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="font-medium">{comm.subject}</div>
                  <div className="text-gray-500 truncate max-w-xs">
                    {comm.message.substring(0, 80)}
                    {comm.message.length > 80 && '...'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {comm.sender ? `${comm.sender.first_name} ${comm.sender.last_name}` : 'Unknown User'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>{getRecipientTypeLabel(comm.recipient_type)}</div>
                  <div className="text-xs text-gray-500">
                    {comm.recipient_ids.length} recipient{comm.recipient_ids.length !== 1 ? 's' : ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getDeliveryMethodBadge(comm.delivery_method)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getStatusBadge(comm.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => setSelectedCommunication(comm)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedCommunication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Communication Details</h3>
                <button
                  onClick={() => setSelectedCommunication(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Subject</label>
                  <p className="text-gray-900 font-medium">{selectedCommunication.subject}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Message</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedCommunication.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sender</label>
                    <p className="text-gray-900">
                      {selectedCommunication.sender
                        ? `${selectedCommunication.sender.first_name} ${selectedCommunication.sender.last_name}`
                        : 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedCommunication.sender?.email || 'No email available'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Sent At</label>
                    <p className="text-gray-900">
                      {selectedCommunication.sent_at
                        ? formatDate(selectedCommunication.sent_at)
                        : 'Not sent yet'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Recipient Type</label>
                    <p className="text-gray-900">
                      {getRecipientTypeLabel(selectedCommunication.recipient_type)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Recipients Count</label>
                    <p className="text-gray-900">{selectedCommunication.recipient_ids.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Delivery Method</label>
                    <div className="mt-1">{getDeliveryMethodBadge(selectedCommunication.delivery_method)}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedCommunication.status)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedCommunication(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
