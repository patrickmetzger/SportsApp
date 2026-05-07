'use client';

import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Athlete {
  id: string;
  student_name: string;
  student_id: string | null;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  status: string;
  payment_status: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  created_at: string;
  summer_programs: {
    id: string;
    name: string;
    schools?: { id: string; name: string } | null;
  } | null;
}

interface AthletesListProps {
  athletes: Athlete[];
  showSchool?: boolean;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-teal-50 text-teal-700',
  rejected: 'bg-red-50 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
  refund_requested: 'bg-orange-50 text-orange-700',
};

const paymentColors: Record<string, string> = {
  paid: 'bg-teal-50 text-teal-700',
  partial: 'bg-amber-50 text-amber-700',
  pending: 'bg-slate-100 text-slate-500',
  overdue: 'bg-red-50 text-red-700',
};

export default function AthletesList({ athletes, showSchool = false }: AthletesListProps) {
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const programs = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of athletes) {
      if (a.summer_programs) {
        seen.set(a.summer_programs.id, a.summer_programs.name);
      }
    }
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [athletes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return athletes.filter((a) => {
      if (q && !a.student_name.toLowerCase().includes(q) && !a.parent_name?.toLowerCase().includes(q) && !a.parent_email?.toLowerCase().includes(q)) return false;
      if (programFilter && a.summer_programs?.id !== programFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (paymentFilter && a.payment_status !== paymentFilter) return false;
      return true;
    });
  }, [athletes, search, programFilter, statusFilter, paymentFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student or parent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All programs</option>
          {programs.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
          <option value="refund_requested">Refund Requested</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All payments</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="pending">Unpaid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <p className="text-sm text-slate-500">{filtered.length} athlete{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <UserGroupIcon className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-500">No athletes found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 font-medium text-slate-500">Student</th>
                {showSchool && <th className="text-left py-3 px-4 font-medium text-slate-500">School</th>}
                <th className="text-left py-3 px-4 font-medium text-slate-500">Program</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Parent</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Payment</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((athlete) => (
                <tr key={athlete.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{athlete.student_name}</p>
                    {athlete.student_id && (
                      <p className="text-xs text-slate-400">ID: {athlete.student_id}</p>
                    )}
                  </td>
                  {showSchool && (
                    <td className="py-3 px-4 text-slate-600">
                      {athlete.summer_programs?.schools?.name ?? '—'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-slate-600">
                    {athlete.summer_programs?.name ?? '—'}
                  </td>
                  <td className="py-3 px-4">
                    {athlete.parent_name ? (
                      <>
                        <p className="text-slate-700">{athlete.parent_name}</p>
                        {athlete.parent_email && (
                          <p className="text-xs text-slate-400">{athlete.parent_email}</p>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[athlete.status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {athlete.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${paymentColors[athlete.payment_status ?? 'pending'] ?? 'bg-slate-100 text-slate-500'}`}>
                      {athlete.payment_status ?? 'unpaid'}
                    </span>
                    {(athlete.amount_due ?? 0) > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        ${(athlete.amount_paid ?? 0).toFixed(0)} / ${(athlete.amount_due ?? 0).toFixed(0)}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(athlete.created_at).toLocaleDateString()}
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
