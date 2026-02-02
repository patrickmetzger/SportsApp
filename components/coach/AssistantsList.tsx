'use client';

import { useState, useEffect } from 'react';
import { UserGroupIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Assistant {
  assignmentId: string;
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  createdAt: string;
}

interface AvailableAssistant {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export default function AssistantsList() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [available, setAvailable] = useState<AvailableAssistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState('');

  const fetchAssistants = async () => {
    try {
      const response = await fetch('/api/coach/assistants');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch assistants');
      }

      setAssistants(data.assistants || []);
      setAvailable(data.available || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssistants();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssistant) return;

    setAdding(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/coach/assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistantId: selectedAssistant })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add assistant');
      }

      setSuccess('Assistant added successfully');
      setShowAddForm(false);
      setSelectedAssistant('');
      await fetchAssistants();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assistant?')) return;

    setRemoving(assignmentId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/coach/assistants?assignmentId=${assignmentId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove assistant');
      }

      setSuccess('Assistant removed successfully');
      await fetchAssistants();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRemoving(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg">
          {success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <UserGroupIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">My Assistants</h2>
            <p className="text-sm text-slate-500">
              {assistants.length} assistant{assistants.length !== 1 ? 's' : ''} assigned
            </p>
          </div>
        </div>

        {available.length > 0 && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            Add Assistant
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <form onSubmit={handleAdd} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Select Assistant Coach
              </label>
              <select
                value={selectedAssistant}
                onChange={(e) => setSelectedAssistant(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Choose an assistant...</option>
                {available.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.first_name} {assistant.last_name} ({assistant.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding || !selectedAssistant}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedAssistant('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assistants List */}
      {assistants.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center">
          <div className="text-gray-400 text-5xl mb-4">
            <UserGroupIcon className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Assistants Yet</h3>
          <p className="text-gray-500 mb-4">
            You haven&apos;t assigned any assistant coaches yet.
            {available.length > 0
              ? ' Click "Add Assistant" to get started.'
              : ' Contact your administrator to create assistant coach accounts.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="divide-y divide-gray-100">
            {assistants.map((assistant) => (
              <div key={assistant.assignmentId} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                    {assistant.first_name?.[0]}{assistant.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {assistant.first_name} {assistant.last_name}
                    </p>
                    <p className="text-sm text-slate-500">{assistant.email}</p>
                    <p className="text-xs text-slate-400">Added {formatDate(assistant.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(assistant.assignmentId)}
                  disabled={removing === assistant.assignmentId}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                  title="Remove assistant"
                >
                  {removing === assistant.assignmentId ? (
                    <span className="text-sm">Removing...</span>
                  ) : (
                    <XMarkIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">About Assistant Coaches</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>* Assistant coaches can view all your programs</li>
          <li>* They can take attendance for active programs</li>
          <li>* They cannot edit programs or manage certifications</li>
          <li>* Remove an assistant to revoke their access to your programs</li>
        </ul>
      </div>
    </div>
  );
}
