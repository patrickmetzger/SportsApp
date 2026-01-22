'use client';

import { ClipboardDocumentListIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  cost: number;
  header_image_url?: string;
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
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Programs Assigned</h3>
        <p className="text-sm text-slate-500">
          You are not currently assigned to any programs. Contact your school administrator.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isProgramActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  const isProgramUpcoming = (startDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    return now < start;
  };

  const getStatusBadge = (startDate: string, endDate: string) => {
    if (isProgramActive(startDate, endDate)) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
          Active
        </span>
      );
    } else if (isProgramUpcoming(startDate)) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
          Upcoming
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          Completed
        </span>
      );
    }
  };

  return (
    <div className="space-y-4">
      {programs.map((program) => (
        <div
          key={program.id}
          className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Program Image */}
            {program.header_image_url && (
              <img
                src={program.header_image_url}
                alt={program.name}
                className="w-full lg:w-40 h-32 object-cover rounded-lg flex-shrink-0"
              />
            )}

            {/* Program Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {program.name}
                    </h3>
                    {getStatusBadge(program.start_date, program.end_date)}
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {program.description || 'No description available'}
                  </p>
                </div>
              </div>

              {/* Dates and Cost */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(program.start_date)} - {formatDate(program.end_date)}</span>
                </div>
                <div className="font-medium text-slate-900">
                  ${Number(program.cost).toFixed(0)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <a
                  href={`/programs/${program.id}`}
                  className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
                >
                  View Details
                </a>
                <a
                  href={`/dashboard/coach/programs/${program.id}/edit`}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Edit Program
                </a>
                <button
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    console.log('Manage registrations for:', program.id);
                  }}
                >
                  Registrations
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
