'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  student_name: string;
  student_id: string;
  parent_user_id?: string;
  parent_email: string;
  parent_phone: string;
}

interface ExistingAttendance {
  id: string;
  student_name: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  notes?: string;
}

interface AssistantTakeAttendanceFormProps {
  programId: string;
  assistantId: string;
  students: Student[];
  existingAttendance: ExistingAttendance[];
  today: string;
}

type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

export default function AssistantTakeAttendanceForm({
  programId,
  assistantId,
  students,
  existingAttendance,
  today
}: AssistantTakeAttendanceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Initialize attendance state from existing records or default to present
  const initialAttendance: Record<string, { status: AttendanceStatus; notes: string }> = {};
  students.forEach(student => {
    const existing = existingAttendance.find(a => a.student_name === student.student_name);
    initialAttendance[student.student_name] = {
      status: existing?.status || 'present',
      notes: existing?.notes || ''
    };
  });

  const [attendance, setAttendance] = useState(initialAttendance);

  const handleStatusChange = (studentName: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentName]: {
        ...prev[studentName],
        status
      }
    }));
  };

  const handleNotesChange = (studentName: string, notes: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentName]: {
        ...prev[studentName],
        notes
      }
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: typeof attendance = {};
    students.forEach(student => {
      updated[student.student_name] = {
        status,
        notes: attendance[student.student_name]?.notes || ''
      };
    });
    setAttendance(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const attendanceRecords = students.map(student => ({
        program_id: programId,
        student_name: student.student_name,
        student_id: student.student_id,
        parent_user_id: student.parent_user_id || null,
        attendance_date: today,
        status: attendance[student.student_name].status,
        notes: attendance[student.student_name].notes || null,
        recorded_by: assistantId
      }));

      const response = await fetch('/api/assistant/attendance/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: attendanceRecords
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save attendance');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/assistant/attendance');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-300';
      case 'absent': return 'bg-red-100 text-red-800 border-red-300';
      case 'excused': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'Y';
      case 'absent': return 'X';
      case 'excused': return '!';
      case 'late': return '*';
    }
  };

  const getTodayFormatted = () => {
    return new Date(today).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, excused: 0, late: 0 };
    Object.values(attendance).forEach(record => {
      counts[record.status]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 text-5xl mb-4">!</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Students Enrolled</h3>
        <p className="text-gray-500">
          There are no students registered for this program yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date and Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 school-branded-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Attendance for {getTodayFormatted()}</h3>
            <p className="text-sm text-gray-500 mt-1">{students.length} {students.length === 1 ? 'student' : 'students'} enrolled</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleMarkAll('present')}
              className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition font-medium"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('absent')}
              className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition font-medium"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-4 pb-6 border-b border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{statusCounts.present}</p>
            <p className="text-xs text-gray-600">Present</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{statusCounts.absent}</p>
            <p className="text-xs text-gray-600">Absent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{statusCounts.excused}</p>
            <p className="text-xs text-gray-600">Excused</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.late}</p>
            <p className="text-xs text-gray-600">Late</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 mt-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded mb-4 mt-4">
            Attendance saved successfully! Redirecting...
          </div>
        )}
      </div>

      {/* Attendance Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          {students.map((student, index) => (
            <div
              key={student.id}
              className={`bg-white rounded-lg shadow p-5 transition ${getStatusColor(attendance[student.student_name].status)} border-2`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{student.student_name}</h4>
                      <p className="text-sm text-gray-600">ID: {student.student_id}</p>
                      <p className="text-xs text-gray-500">{student.parent_email}</p>
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {(['present', 'absent', 'excused', 'late'] as const).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusChange(student.student_name, status)}
                        className={`py-2 px-3 rounded-lg font-medium text-sm transition ${
                          attendance[student.student_name].status === status
                            ? getStatusColor(status) + ' border-2'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                        }`}
                      >
                        <span className="mr-1">{getStatusIcon(status)}</span>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Notes */}
                  <input
                    type="text"
                    placeholder="Add notes (optional)"
                    value={attendance[student.student_name].notes}
                    onChange={(e) => handleNotesChange(student.student_name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 school-branded-btn-primary py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : existingAttendance.length > 0 ? 'Update Attendance' : 'Save Attendance'}
          </button>
          <a
            href="/dashboard/assistant/attendance"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
