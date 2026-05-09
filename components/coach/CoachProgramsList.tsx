'use client';

import { ClipboardDocumentListIcon, CalendarIcon } from '@heroicons/react/24/outline';
import ProgramImagePlaceholder from '@/components/programs/ProgramImagePlaceholder';

interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  cost: number;
  header_image_url?: string;
  status?: string;
  rejection_reason?: string | null;
  submitted_by?: string | null;
}

interface CoachProgramsListProps {
  programs: Program[];
}

export default function CoachProgramsList({ programs }: CoachProgramsListProps) {
  if (!programs || programs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-card">
        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <ClipboardDocumentListIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Programs Yet</h3>
        <p className="text-sm text-slate-500">
          You have no programs assigned or submitted. Use the button above to submit a new program.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimelineBadge = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now >= start && now <= end) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
          Active
        </span>
      );
    } else if (now < start) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
          Upcoming
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
        Completed
      </span>
    );
  };

  const getApprovalBadge = (status?: string) => {
    if (!status || status === 'approved') return null;
    if (status === 'pending') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
          Awaiting Approval
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
          Not Approved
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-wrap gap-6">
      {programs.map((program) => {
        const isPendingOrRejected = program.status === 'pending' || program.status === 'rejected';
        return (
          <div
            key={program.id}
            className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow flex flex-col w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
          >
            {/* Header image */}
            {program.header_image_url ? (
              <img
                src={program.header_image_url}
                alt={program.name}
                className="w-full h-40 object-cover rounded-t-xl flex-shrink-0"
              />
            ) : (
              <ProgramImagePlaceholder className="w-full h-40 rounded-t-xl flex-shrink-0" />
            )}

            <div className="flex flex-col flex-1 p-5">
              {/* Title + badges */}
              <div className="flex items-start gap-2 flex-wrap mb-1">
                <h3 className="text-base font-semibold text-slate-900 flex-1">{program.name}</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {getApprovalBadge(program.status)}
                {!isPendingOrRejected && getTimelineBadge(program.start_date, program.end_date)}
              </div>

              <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                {program.description || 'No description available'}
              </p>


              {/* Dates + cost */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-4">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{formatDate(program.start_date)} – {formatDate(program.end_date)}</span>
                </div>
                <span className="font-medium text-slate-900">${Number(program.cost).toFixed(0)}</span>
              </div>

              {/* Actions — pushed to bottom */}
              <div className="flex flex-col gap-2 mt-auto">
                {!isPendingOrRejected && (
                  <a
                    href={`/dashboard/coach/attendance?program=${program.id}`}
                    className="w-full text-center px-3 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    Take Attendance
                  </a>
                )}
                <div className="flex flex-wrap gap-2">
                  {!isPendingOrRejected && (
                    <a
                      href={`/programs/${program.id}`}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      View Details
                    </a>
                  )}
                  {!isPendingOrRejected && (
                    <a
                      href={`/dashboard/coach/programs/${program.id}/edit`}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Edit
                    </a>
                  )}
                  {program.status === 'pending' && (
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-sm font-medium rounded-lg">
                      Pending Review
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
