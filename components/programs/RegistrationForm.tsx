'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationSchema, type RegistrationFormData } from '@/lib/validation/programSchema';

export default function RegistrationForm({ programId }: { programId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [parentAccountCreated, setParentAccountCreated] = useState(false);
  const [validatingStudent, setValidatingStudent] = useState(false);
  const [isLoggedInParent, setIsLoggedInParent] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [useExistingChild, setUseExistingChild] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError: setFormError,
    setValue,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const studentId = watch('studentId');

  // Fetch current user and children if logged in as parent
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.role === 'parent') {
            setIsLoggedInParent(true);
            // Pre-populate parent fields
            const fullName = `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim();
            setValue('parentName', fullName);
            setValue('parentEmail', data.user.email);

            // Fetch children
            const childrenResponse = await fetch('/api/parent/children');
            if (childrenResponse.ok) {
              const childrenData = await childrenResponse.json();
              if (childrenData.children && childrenData.children.length > 0) {
                setChildren(childrenData.children);
                // Auto-select first child
                const firstChild = childrenData.children[0];
                setSelectedChildId(firstChild.id);
                setValue('studentName', `${firstChild.first_name} ${firstChild.last_name}`);
                if (firstChild.student_id) {
                  setValue('studentId', firstChild.student_id);
                }
              } else {
                // No children, switch to manual entry
                setUseExistingChild(false);
              }
            }
          }
        }
      } catch (err) {
        // User not logged in or error fetching, continue as guest
      } finally {
        setLoadingUser(false);
      }
    };

    fetchCurrentUser();
  }, [setValue]);

  // Handle child selection
  const handleChildSelection = (childId: string) => {
    setSelectedChildId(childId);
    const child = children.find(c => c.id === childId);
    if (child) {
      setValue('studentName', `${child.first_name} ${child.last_name}`);
      if (child.student_id) {
        setValue('studentId', child.student_id);
      } else {
        setValue('studentId', '');
      }
    }
  };

  // Validate student ID on blur
  const validateStudentId = async () => {
    if (!studentId || studentId.length < 6) return;

    setValidatingStudent(true);
    try {
      const response = await fetch('/api/programs/validate-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError('studentId', {
          type: 'manual',
          message: data.error || 'Invalid student ID',
        });
      }
    } catch (err) {
      setFormError('studentId', {
        type: 'manual',
        message: 'Failed to validate student ID',
      });
    } finally {
      setValidatingStudent(false);
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/programs/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      setSuccess(true);
      setParentAccountCreated(result.parentAccountCreated || false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-2">
          <svg
            className="w-6 h-6 text-green-600 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-lg font-semibold text-green-900">
            Registration Submitted!
          </h3>
        </div>
        <div className="space-y-2">
          <p className="text-green-700">
            Thank you for registering. Your registration is pending approval.
          </p>
          {parentAccountCreated && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800 text-sm font-medium">
                📧 Parent Account Created
              </p>
              <p className="text-blue-700 text-sm mt-1">
                We've created an account for you and sent an email with instructions to set up your password.
                Check your inbox to complete your account setup and track your registrations.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Child Selection - Only show if parent is logged in and has children */}
      {isLoggedInParent && children.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-900">
              Select Student
            </label>
            <button
              type="button"
              onClick={() => {
                setUseExistingChild(!useExistingChild);
                if (useExistingChild) {
                  // Switching to manual, clear fields
                  setValue('studentName', '');
                  setValue('studentId', '');
                }
              }}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {useExistingChild ? 'Enter manually instead' : 'Select from my children'}
            </button>
          </div>

          {useExistingChild ? (
            <select
              value={selectedChildId}
              onChange={(e) => handleChildSelection(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.first_name} {child.last_name}
                  {child.student_id ? ` (${child.student_id})` : ''}
                  {child.grade ? ` - Grade ${child.grade}` : ''}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      )}

      <div>
        <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-1">
          Student Name *
        </label>
        <input
          id="studentName"
          type="text"
          {...register('studentName')}
          readOnly={isLoggedInParent && children.length > 0 && useExistingChild}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isLoggedInParent && children.length > 0 && useExistingChild ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          placeholder="John Doe"
        />
        {errors.studentName && (
          <p className="text-red-600 text-xs mt-1">{errors.studentName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
          Student ID *
        </label>
        <input
          id="studentId"
          type="text"
          {...register('studentId')}
          onBlur={validateStudentId}
          readOnly={isLoggedInParent && children.length > 0 && useExistingChild}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isLoggedInParent && children.length > 0 && useExistingChild ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          placeholder="STU001"
        />
        {validatingStudent && (
          <p className="text-blue-600 text-xs mt-1">Validating...</p>
        )}
        {errors.studentId && (
          <p className="text-red-600 text-xs mt-1">{errors.studentId.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="parentName" className="block text-sm font-medium text-gray-700 mb-1">
          Parent/Guardian Name *
        </label>
        <input
          id="parentName"
          type="text"
          {...register('parentName')}
          readOnly={isLoggedInParent}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isLoggedInParent ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          placeholder="Jane Doe"
        />
        {isLoggedInParent && (
          <p className="text-blue-600 text-xs mt-1">Auto-filled from your account</p>
        )}
        {errors.parentName && (
          <p className="text-red-600 text-xs mt-1">{errors.parentName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700 mb-1">
          Parent Email *
        </label>
        <input
          id="parentEmail"
          type="email"
          {...register('parentEmail')}
          readOnly={isLoggedInParent}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isLoggedInParent ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          placeholder="parent@example.com"
        />
        {isLoggedInParent && (
          <p className="text-blue-600 text-xs mt-1">Auto-filled from your account</p>
        )}
        {errors.parentEmail && (
          <p className="text-red-600 text-xs mt-1">{errors.parentEmail.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700 mb-1">
          Parent Phone *
        </label>
        <input
          id="parentPhone"
          type="tel"
          {...register('parentPhone')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="(555) 123-4567"
        />
        {errors.parentPhone && (
          <p className="text-red-600 text-xs mt-1">{errors.parentPhone.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
      >
        {loading ? 'Submitting...' : 'Submit Registration'}
      </button>
    </form>
  );
}
