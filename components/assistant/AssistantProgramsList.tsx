'use client';

interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  cost: number;
  header_image_url?: string;
  coach_id: string;
}

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AssistantProgramsListProps {
  programs: Program[];
  coaches: Coach[];
}

export default function AssistantProgramsList({ programs, coaches }: AssistantProgramsListProps) {
  if (!programs || programs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 text-5xl mb-4">!</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Programs Available</h3>
        <p className="text-gray-500">
          Your assigned coaches don&apos;t have any programs yet, or you haven&apos;t been assigned to any coaches.
        </p>
      </div>
    );
  }

  const getCoachName = (coachId: string) => {
    const coach = coaches.find(c => c.id === coachId);
    return coach ? `${coach.first_name} ${coach.last_name}` : 'Unknown Coach';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProgramStatus = (program: Program) => {
    const now = new Date();
    const start = new Date(program.start_date);
    const end = new Date(program.end_date);

    if (now < start) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (now > end) {
      return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
    } else {
      return { label: 'Active', color: 'bg-green-100 text-green-800' };
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {programs.map((program) => {
        const status = getProgramStatus(program);
        return (
          <div
            key={program.id}
            className="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-card-hover transition"
          >
            {program.header_image_url && (
              <div className="h-32 bg-gray-200 overflow-hidden">
                <img
                  src={program.header_image_url}
                  alt={program.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-900 text-lg">{program.name}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                {program.description || 'No description available'}
              </p>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Coach:</span>
                  <span className="font-medium">{getCoachName(program.coach_id)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Dates:</span>
                  <span>{formatDate(program.start_date)} - {formatDate(program.end_date)}</span>
                </div>
              </div>

              {status.label === 'Active' && (
                <a
                  href={`/dashboard/assistant/attendance/${program.id}`}
                  className="block w-full text-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium"
                >
                  Take Attendance
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
