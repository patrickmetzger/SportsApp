'use client';

import { useState, useEffect } from 'react';

interface ManualRegistrationFormProps {
  programId: string;
  programCost: number;
  registration?: any; // If provided, we're editing
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ManualRegistrationForm({
  programId,
  programCost,
  registration,
  onSuccess,
  onCancel,
}: ManualRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allChildren, setAllChildren] = useState<any[]>([]);
  const [mockStudents, setMockStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [formData, setFormData] = useState({
    student_id: registration?.student_id || '',
    student_name: registration?.student_name || '',
    parent_name: registration?.parent_name || '',
    parent_email: registration?.parent_email || '',
    parent_phone: registration?.parent_phone || '',
    status: registration?.status || 'approved',
    payment_status: registration?.payment_status || 'pending',
    amount_due: registration?.amount_due?.toString() || programCost.toString(),
    amount_paid: registration?.amount_paid?.toString() || '0',
    payment_due_date: registration?.payment_due_date || '',
    notes: registration?.notes || '',
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // Fetch parent children
        const childrenResponse = await fetch('/api/admin/parent-children');
        if (childrenResponse.ok) {
          const childrenData = await childrenResponse.json();
          setAllChildren(childrenData.children || []);
        }

        // Fetch mock students
        const mockResponse = await fetch('/api/admin/mock-students');
        if (mockResponse.ok) {
          const mockData = await mockResponse.json();
          setMockStudents(mockData.students || []);
        }
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = e.target.value;

    if (!studentId) {
      setFormData((prev) => ({
        ...prev,
        student_id: '',
        student_name: '',
      }));
      return;
    }

    // Check if it's from parent_children
    const child = allChildren.find((c) => c.student_id === studentId);
    if (child) {
      setFormData((prev) => ({
        ...prev,
        student_id: studentId,
        student_name: `${child.first_name} ${child.last_name}`,
        parent_name: child.parent ? `${child.parent.first_name} ${child.parent.last_name}` : prev.parent_name,
        parent_email: child.parent?.email || prev.parent_email,
      }));
      return;
    }

    // Check if it's from mock_students
    const mockStudent = mockStudents.find((s) => s.student_id === studentId);
    if (mockStudent) {
      setFormData((prev) => ({
        ...prev,
        student_id: studentId,
        student_name: `${mockStudent.first_name} ${mockStudent.last_name}`,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = registration
        ? `/api/admin/registrations/${registration.id}`
        : '/api/admin/registrations/create';

      const method = registration ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          program_id: programId,
          amount_due: parseFloat(formData.amount_due),
          amount_paid: parseFloat(formData.amount_paid),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save registration');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Student Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Student
        </label>
        <select
          onChange={handleStudentSelect}
          value={formData.student_id}
          disabled={!!registration || loadingStudents}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        >
          <option value="">Choose a student or enter manually below...</option>
          {allChildren.length > 0 && (
            <optgroup label="Parent Children">
              {allChildren.map((child) => (
                <option key={child.id} value={child.student_id}>
                  {child.first_name} {child.last_name} ({child.student_id}) - Parent: {child.parent?.first_name} {child.parent?.last_name}
                </option>
              ))}
            </optgroup>
          )}
          {mockStudents.length > 0 && (
            <optgroup label="All Students">
              {mockStudents.map((student) => (
                <option key={student.id} value={student.student_id}>
                  {student.first_name} {student.last_name} ({student.student_id}) - Grade {student.grade}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Manual Entry Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student ID *
          </label>
          <input
            name="student_id"
            type="text"
            required
            value={formData.student_id}
            onChange={handleChange}
            disabled={!!registration}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="STU001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student Name *
          </label>
          <input
            name="student_name"
            type="text"
            required
            value={formData.student_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="John Doe"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent Name *
          </label>
          <input
            name="parent_name"
            type="text"
            required
            value={formData.parent_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent Email *
          </label>
          <input
            name="parent_email"
            type="email"
            required
            value={formData.parent_email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="parent@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Parent Phone *
        </label>
        <input
          name="parent_phone"
          type="tel"
          required
          value={formData.parent_phone}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Registration Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Status *
          </label>
          <select
            name="payment_status"
            value={formData.payment_status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Payment Information */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount Due *
          </label>
          <input
            name="amount_due"
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.amount_due}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount Paid *
          </label>
          <input
            name="amount_paid"
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.amount_paid}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Due Date
          </label>
          <input
            name="payment_due_date"
            type="date"
            value={formData.payment_due_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Scholarship, sponsor information, special circumstances, etc."
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
        >
          {loading ? 'Saving...' : registration ? 'Update Registration' : 'Add Registration'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
