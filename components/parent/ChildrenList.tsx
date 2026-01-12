'use client';

import { useState } from 'react';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  student_id?: string;
  date_of_birth?: string;
  grade?: number;
  gender?: string;
  notes?: string;
}

interface ChildrenListProps {
  children: Child[];
  onRefresh: () => void;
}

export default function ChildrenList({ children, onRefresh }: ChildrenListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editFormData, setEditFormData] = useState<Partial<Child>>({});

  const handleEdit = (child: Child) => {
    setEditingId(child.id);
    setEditFormData(child);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
    setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (childId: string) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/parent/children/${childId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          grade: editFormData.grade ? parseInt(editFormData.grade.toString()) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update child');
      }

      setEditingId(null);
      setEditFormData({});
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (childId: string, childName: string) => {
    if (!confirm(`Are you sure you want to remove ${childName}?`)) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/parent/children/${childId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete child');
      }

      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (children.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No children added yet. Click "Add Child" to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {children.map((child) => (
        <div key={child.id} className="bg-white border border-gray-200 rounded-lg p-4">
          {editingId === child.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    name="first_name"
                    type="text"
                    required
                    value={editFormData.first_name || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    name="last_name"
                    type="text"
                    required
                    value={editFormData.last_name || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Student ID
                </label>
                <input
                  name="student_id"
                  type="text"
                  value={editFormData.student_id || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    name="date_of_birth"
                    type="date"
                    value={editFormData.date_of_birth || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Grade
                  </label>
                  <input
                    name="grade"
                    type="number"
                    min="1"
                    max="12"
                    value={editFormData.grade || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={editFormData.gender || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  value={editFormData.notes || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveEdit(child.id)}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-1.5 px-3 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-200 text-gray-700 py-1.5 px-3 rounded text-sm hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {child.first_name} {child.last_name}
                  </h3>
                  {child.student_id && (
                    <p className="text-sm text-gray-600">Student ID: {child.student_id}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(child)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(child.id, `${child.first_name} ${child.last_name}`)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:text-gray-400"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                {child.date_of_birth && (
                  <div>
                    <span className="font-medium">DOB:</span> {new Date(child.date_of_birth).toLocaleDateString()}
                  </div>
                )}
                {child.grade && (
                  <div>
                    <span className="font-medium">Grade:</span> {child.grade}
                  </div>
                )}
                {child.gender && (
                  <div>
                    <span className="font-medium">Gender:</span> {child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}
                  </div>
                )}
              </div>

              {child.notes && (
                <p className="mt-2 text-sm text-gray-600">{child.notes}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
