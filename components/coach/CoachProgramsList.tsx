'use client';

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
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 text-5xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Programs Assigned</h3>
        <p className="text-gray-500">
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    } else if (isProgramUpcoming(startDate)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium school-badge-primary">
          Upcoming
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
          className="bg-white rounded-lg shadow hover:shadow-lg transition school-branded-card"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {program.name}
                  </h3>
                  {getStatusBadge(program.start_date, program.end_date)}
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {program.description || 'No description available'}
                </p>
              </div>
              {program.header_image_url && (
                <img
                  src={program.header_image_url}
                  alt={program.name}
                  className="w-24 h-24 object-cover rounded-lg ml-4"
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-1">Start Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(program.start_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">End Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(program.end_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Cost</p>
                <p className="text-sm font-medium text-gray-900">
                  ${Number(program.cost).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <a
                href={`/programs/${program.id}`}
                className="flex-1 text-center px-4 py-2 school-branded-btn-primary rounded-lg text-sm font-medium"
              >
                View Details
              </a>
              <a
                href={`/dashboard/coach/programs/${program.id}/edit`}
                className="px-4 py-2 school-branded-btn-secondary rounded-lg text-sm font-medium"
              >
                Edit Program
              </a>
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                onClick={() => {
                  // TODO: Navigate to manage registrations
                  console.log('Manage registrations for:', program.id);
                }}
              >
                Registrations
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
