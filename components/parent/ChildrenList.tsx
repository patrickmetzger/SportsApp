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
      <div className="text-center py-12">
        <p className="text-sm text-gray-400">
          No children added yet. Click "Add Child" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 rounded-xl px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {children.map((child) => (
        <div key={child.id} className="bg-white rounded-xl p-6 hover:shadow-bento transition-all duration-300">
          {editingId === child.id ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-2">
                    First Name *
                  </label>
                  <input
                    name="first_name"
                    type="text"
                    required
                    value={editFormData.first_name || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-cream-50 border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-2">
                    Last Name *
                  </label>
                  <input
                    name="last_name"
                    type="text"
                    required
                    value={editFormData.last_name || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-cream-50 border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-2">
                  Student ID
                </label>
                <input
                  name="student_id"
                  type="text"
                  value={editFormData.student_id || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-cream-50 border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-2">
                    Date of Birth
                  </label>
                  <input
                    name="date_of_birth"
                    type="date"
                    value={editFormData.date_of_birth || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-cream-50 border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-2">
                    Grade
                  </label>
                  <input
                    name="grade"
                    type="number"
                    min="1"
                    max="12"
                    value={editFormData.grade || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-cream-50 border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={editFormData.gender || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-cream-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                >
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  value={editFormData.notes || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-cream-50 border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => handleSaveEdit(child.id)}
                  disabled={loading}
                  className="flex-1 bg-black text-white py-3 px-4 text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-gray-800 disabled:bg-gray-400 transition-all duration-300"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-cream-100 text-black py-3 px-4 text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-cream-200 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-bold tracking-tight text-black mb-1">
                    {child.first_name} {child.last_name}
                  </h4>
                  {child.student_id && (
                    <p className="text-sm text-gray-500">Student ID: {child.student_id}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEdit(child)}
                    className="px-4 py-2 bg-cream-100 text-black text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-cream-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(child.id, `${child.first_name} ${child.last_name}`)}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {(child.date_of_birth || child.grade || child.gender) && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  {child.date_of_birth && (
                    <div className="bg-cream-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 font-medium mb-1">Date of Birth</p>
                      <p className="text-sm font-semibold text-black">{new Date(child.date_of_birth).toLocaleDateString()}</p>
                    </div>
                  )}
                  {child.grade && (
                    <div className="bg-cream-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 font-medium mb-1">Grade</p>
                      <p className="text-sm font-semibold text-black">{child.grade}</p>
                    </div>
                  )}
                  {child.gender && (
                    <div className="bg-cream-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 font-medium mb-1">Gender</p>
                      <p className="text-sm font-semibold text-black">{child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}</p>
                    </div>
                  )}
                </div>
              )}

              {child.notes && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-medium mb-2">Notes</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{child.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
