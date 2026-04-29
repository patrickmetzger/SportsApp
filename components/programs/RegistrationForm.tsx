'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationSchema, type RegistrationFormData } from '@/lib/validation/programSchema';

interface Program {
  id: string;
  min_grade?: number | null;
  max_grade?: number | null;
  min_age?: number | null;
  max_age?: number | null;
  gender_restriction?: string | null;
}

function getAgeFromDob(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function isChildEligible(child: any, program: Program): { eligible: boolean; reason?: string } {
  if (program.min_grade != null && (child.grade == null || child.grade < program.min_grade))
    return { eligible: false, reason: `Grade ${program.min_grade}+ required` };
  if (program.max_grade != null && (child.grade == null || child.grade > program.max_grade))
    return { eligible: false, reason: `Grade ${program.max_grade} or below required` };
  if (child.date_of_birth) {
    const age = getAgeFromDob(child.date_of_birth);
    if (program.min_age != null && age < program.min_age)
      return { eligible: false, reason: `Must be at least ${program.min_age} years old` };
    if (program.max_age != null && age > program.max_age)
      return { eligible: false, reason: `Must be ${program.max_age} or younger` };
  }
  if (program.gender_restriction && program.gender_restriction !== 'any' && child.gender && child.gender !== program.gender_restriction)
    return { eligible: false, reason: `Program is for ${program.gender_restriction} students only` };
  return { eligible: true };
}

export default function RegistrationForm({ programId, program }: { programId: string; program: Program }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [parentAccountCreated, setParentAccountCreated] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [validatingStudent, setValidatingStudent] = useState(false);
  const [isLoggedInParent, setIsLoggedInParent] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [registeredStudentIds, setRegisteredStudentIds] = useState<Set<string>>(new Set());
  const [registeredStudentNames, setRegisteredStudentNames] = useState<Set<string>>(new Set());
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

            // Fetch children and already-registered student IDs in parallel
            const [childrenResponse, registeredResponse] = await Promise.all([
              fetch('/api/parent/children'),
              fetch(`/api/programs/${programId}/registered-children`),
            ]);

            if (childrenResponse.ok) {
              const childrenData = await childrenResponse.json();
              const allChildren: any[] = childrenData.children || [];
              setChildren(allChildren);

              // Build sets of already-registered student_ids and names
              const registeredIds = new Set<string>();
              const registeredNames = new Set<string>();
              if (registeredResponse.ok) {
                const regData = await registeredResponse.json();
                (regData.children || []).forEach((r: any) => {
                  if (r.student_id) registeredIds.add(r.student_id);
                  if (r.student_name) registeredNames.add(r.student_name.trim().toLowerCase());
                });
              }
              setRegisteredStudentIds(registeredIds);
              setRegisteredStudentNames(registeredNames);

              // Find first eligible, unregistered child to auto-select
              const available = allChildren.filter((c) => {
                const alreadyReg =
                  (c.student_id && registeredIds.has(c.student_id)) ||
                  registeredNames.has(`${c.first_name} ${c.last_name}`.trim().toLowerCase());
                return !alreadyReg && isChildEligible(c, program).eligible;
              });

              if (available.length > 0) {
                const first = available[0];
                setSelectedChildId(first.id);
                setValue('studentName', `${first.first_name} ${first.last_name}`);
                if (first.student_id) setValue('studentId', first.student_id);
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

  // Redirect to parent portal after successful registration
  useEffect(() => {
    if (!success || !isLoggedInParent) return;
    if (countdown <= 0) {
      router.push('/dashboard/parent');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [success, isLoggedInParent, countdown, router]);

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
          {isLoggedInParent && (
            <p className="text-green-600 text-sm mt-3">
              Redirecting to your portal in {countdown}s…
            </p>
          )}
        </div>
      </div>
    );
  }

  const isAlreadyRegistered = (c: any) => {
    if (c.student_id && registeredStudentIds.has(c.student_id)) return true;
    const fullName = `${c.first_name} ${c.last_name}`.trim().toLowerCase();
    if (registeredStudentNames.has(fullName)) return true;
    return false;
  };

  const availableChildren = children.filter(
    (c) => !isAlreadyRegistered(c) && isChildEligible(c, program).eligible
  );

  // Logged-in parent with no children — gate the form
  if (!loadingUser && isLoggedInParent && children.length === 0) {
    const returnTo = typeof window !== 'undefined' ? window.location.pathname : '';
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 space-y-3">
        <p className="text-sm font-semibold text-amber-900">Add a child first</p>
        <p className="text-sm text-amber-700">
          You need to add at least one child to your profile before registering for a program.
        </p>
        <a
          href={`/dashboard/parent?addChild=1&returnTo=${encodeURIComponent(returnTo)}`}
          className="inline-block w-full text-center bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition text-sm font-semibold"
        >
          Add a Child
        </a>
      </div>
    );
  }

  // Logged-in parent but no eligible/unregistered children
  if (!loadingUser && isLoggedInParent && children.length > 0 && availableChildren.length === 0) {
    const allRegistered = children.every((c) => c.student_id && registeredStudentIds.has(c.student_id));
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-2">
        <p className="text-sm font-semibold text-gray-900">
          {allRegistered ? 'Already registered' : 'No eligible children'}
        </p>
        <p className="text-sm text-gray-600">
          {allRegistered
            ? 'All of your children are already registered for this program.'
            : 'None of your children meet the eligibility requirements for this program.'}
        </p>
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

      {/* Child Selection - Only show if parent is logged in and has eligible children */}
      {isLoggedInParent && availableChildren.length > 0 && (
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
                  setValue('studentName', '');
                  setValue('studentId', '');
                }
              }}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {useExistingChild ? 'Enter manually instead' : 'Select from my children'}
            </button>
          </div>

          {useExistingChild && (
            <select
              value={selectedChildId}
              onChange={(e) => handleChildSelection(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {availableChildren.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.first_name} {child.last_name}
                  {child.student_id ? ` (${child.student_id})` : ''}
                  {child.grade ? ` - Grade ${child.grade}` : ''}
                </option>
              ))}
            </select>
          )}
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
          readOnly={isLoggedInParent && availableChildren.length > 0 && useExistingChild}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isLoggedInParent && availableChildren.length > 0 && useExistingChild ? 'bg-gray-100 cursor-not-allowed' : ''
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
          readOnly={isLoggedInParent && availableChildren.length > 0 && useExistingChild}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isLoggedInParent && availableChildren.length > 0 && useExistingChild ? 'bg-gray-100 cursor-not-allowed' : ''
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
