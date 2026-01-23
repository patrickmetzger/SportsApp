'use client';

import { useState } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Student {
  id: string;
  name: string;
  studentId: string;
  parentId: string;
  parentName: string | null;
  parentEmail: string | null;
}

interface Program {
  id: string;
  name: string;
  schoolId: string;
  schoolName: string;
  students: Student[];
}

interface IncidentReportFormProps {
  programs: Program[];
}

const severityOptions = [
  { value: 'minor', label: 'Minor', description: 'Small scrapes, bumps, no medical attention needed', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'moderate', label: 'Moderate', description: 'Requires first aid or minor medical attention', color: 'bg-orange-100 text-orange-800' },
  { value: 'serious', label: 'Serious', description: 'Requires immediate medical attention', color: 'bg-red-100 text-red-800' },
  { value: 'emergency', label: 'Emergency', description: 'Life-threatening, 911 called', color: 'bg-red-600 text-white' },
];

const notifyOptions = [
  { value: 'parent', label: 'Parent/Guardian' },
  { value: 'school_admin', label: 'School Administration' },
  { value: 'nurse', label: 'School Nurse' },
];

export default function IncidentReportForm({ programs }: IncidentReportFormProps) {
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [notifyParties, setNotifyParties] = useState<string[]>(['parent']);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const currentProgram = programs.find(p => p.id === selectedProgram);
  const currentStudent = currentProgram?.students.find(s => s.id === selectedStudent);

  const handleNotifyChange = (value: string) => {
    setNotifyParties(prev =>
      prev.includes(value)
        ? prev.filter(p => p !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !selectedStudent || !severity || !description.trim()) return;

    setSending(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/coach/incident/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: selectedProgram,
          registration_id: selectedStudent,
          student_name: currentStudent?.name,
          severity,
          description: description.trim(),
          action_taken: actionTaken.trim(),
          notify_parties: notifyParties,
          school_id: currentProgram?.schoolId,
          parent_id: currentStudent?.parentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit incident report');
      }

      setSuccess(true);
      // Reset form
      setSelectedProgram('');
      setSelectedStudent('');
      setSeverity('');
      setDescription('');
      setActionTaken('');
      setNotifyParties(['parent']);

    } catch (err: any) {
      setError(err.message || 'Failed to submit incident report');
    } finally {
      setSending(false);
    }
  };

  if (programs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-card p-8 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No programs assigned</p>
        <p className="text-slate-400 text-sm mt-1">You need to be assigned to a program to report incidents</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      {success && (
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-3">
          <CheckCircleIcon className="w-5 h-5 text-teal-600" />
          <div>
            <p className="font-medium text-teal-800">Incident report submitted</p>
            <p className="text-sm text-teal-700">Notifications have been sent to the selected parties.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-800">{error}</p>
          <button onClick={() => setError('')}>
            <XMarkIcon className="w-5 h-5 text-red-500" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Program Selection */}
        <div>
          <label htmlFor="program" className="block text-sm font-medium text-slate-700 mb-1.5">
            Program
          </label>
          <select
            id="program"
            value={selectedProgram}
            onChange={(e) => {
              setSelectedProgram(e.target.value);
              setSelectedStudent('');
            }}
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">Select a program</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>

        {/* Student Selection */}
        <div>
          <label htmlFor="student" className="block text-sm font-medium text-slate-700 mb-1.5">
            Student Involved
          </label>
          <select
            id="student"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            required
            disabled={!selectedProgram}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option value="">Select a student</option>
            {currentProgram?.students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.studentId})
              </option>
            ))}
          </select>
          {currentStudent?.parentName && (
            <p className="mt-1.5 text-sm text-slate-500">
              Parent: {currentStudent.parentName}
            </p>
          )}
        </div>

        {/* Severity Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Severity Level
          </label>
          <div className="grid grid-cols-2 gap-3">
            {severityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSeverity(option.value)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  severity === option.value
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${option.color}`}>
                  {option.label}
                </span>
                <p className="text-sm text-slate-500 mt-2">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
            What happened?
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
            placeholder="Describe the incident in detail..."
          />
        </div>

        {/* Action Taken */}
        <div>
          <label htmlFor="action" className="block text-sm font-medium text-slate-700 mb-1.5">
            Action Taken
          </label>
          <textarea
            id="action"
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
            placeholder="What first aid or actions were taken? (Optional)"
          />
        </div>

        {/* Notify Parties */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Notify
          </label>
          <div className="flex flex-wrap gap-3">
            {notifyOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                  notifyParties.includes(option.value)
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={notifyParties.includes(option.value)}
                  onChange={() => handleNotifyChange(option.value)}
                  className="sr-only"
                />
                <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                  notifyParties.includes(option.value)
                    ? 'bg-teal-500 border-teal-500'
                    : 'border-slate-300'
                }`}>
                  {notifyParties.includes(option.value) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={sending || !selectedProgram || !selectedStudent || !severity || !description.trim()}
            className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {sending ? (
              'Submitting...'
            ) : (
              <>
                <ExclamationTriangleIcon className="w-5 h-5" />
                Submit Incident Report
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
