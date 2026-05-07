'use client';

import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string | null;
  date_of_birth: string | null;
  gender: string | null;
  grade: number | null;
  created_at: string;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    schools?: { id: string; name: string } | null;
  } | null;
}

interface StudentsListProps {
  students: Student[];
  showSchool?: boolean;
}

function getAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const gradeLabel = (grade: number | null) => {
  if (grade === null) return '—';
  if (grade === 0) return 'K';
  return `Grade ${grade}`;
};

export default function StudentsList({ students, showSchool = false }: StudentsListProps) {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  const grades = useMemo(() => {
    const seen = new Set<number>();
    for (const s of students) {
      if (s.grade !== null) seen.add(s.grade);
    }
    return [...seen].sort((a, b) => a - b);
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => {
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      const parentName = `${s.users?.first_name ?? ''} ${s.users?.last_name ?? ''}`.toLowerCase();
      if (q && !fullName.includes(q) && !parentName.includes(q) && !(s.student_id ?? '').toLowerCase().includes(q)) return false;
      if (gradeFilter !== '' && String(s.grade) !== gradeFilter) return false;
      if (genderFilter && s.gender !== genderFilter) return false;
      return true;
    });
  }, [students, search, gradeFilter, genderFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, parent, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All grades</option>
          {grades.map((g) => (
            <option key={g} value={String(g)}>{gradeLabel(g)}</option>
          ))}
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      <p className="text-sm text-slate-500">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <UserGroupIcon className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-500">No students found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 font-medium text-slate-500">Student</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Grade</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Age</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Gender</th>
                {showSchool && <th className="text-left py-3 px-4 font-medium text-slate-500">School</th>}
                <th className="text-left py-3 px-4 font-medium text-slate-500">Parent</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{student.first_name} {student.last_name}</p>
                    {student.student_id && (
                      <p className="text-xs text-slate-400">ID: {student.student_id}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{gradeLabel(student.grade)}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {student.date_of_birth ? getAge(student.date_of_birth) : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 capitalize">{student.gender ?? '—'}</td>
                  {showSchool && (
                    <td className="py-3 px-4 text-slate-600">
                      {student.users?.schools?.name ?? '—'}
                    </td>
                  )}
                  <td className="py-3 px-4">
                    {student.users ? (
                      <>
                        <p className="text-slate-700">{student.users.first_name} {student.users.last_name}</p>
                        {student.users.email && (
                          <p className="text-xs text-slate-400">{student.users.email}</p>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(student.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
