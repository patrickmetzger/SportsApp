'use client';

interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  student_count: number;
  coach_name: string;
}

interface AssistantAttendanceListProps {
  programs: Program[];
  assistantId: string;
}

export default function AssistantAttendanceList({ programs, assistantId }: AssistantAttendanceListProps) {
  if (!programs || programs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 text-5xl mb-4">!</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Programs</h3>
        <p className="text-gray-500">
          Your assigned coaches don&apos;t have any programs currently in session. Attendance is only available for active programs.
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

  const getTodayFormatted = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Today's Date Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">!</div>
          <div>
            <p className="text-sm text-blue-600 font-medium">Today&apos;s Date</p>
            <p className="text-lg font-semibold text-blue-900">{getTodayFormatted()}</p>
          </div>
        </div>
      </div>

      {/* Active Programs List */}
      <div className="grid gap-6">
        {programs.map((program) => (
          <div
            key={program.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition school-branded-card"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {program.name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active Now
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {program.description || 'No description available'}
                  </p>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Coach:</span>
                      <span className="font-medium">{program.coach_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">!</span>
                      <span>{formatDate(program.start_date)} - {formatDate(program.end_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">!</span>
                      <span>{program.student_count} {program.student_count === 1 ? 'student' : 'students'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                <a
                  href={`/dashboard/assistant/attendance/${program.id}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 school-branded-btn-primary rounded-lg text-sm font-medium"
                >
                  <span>!</span>
                  <span>Take Attendance</span>
                </a>
                <a
                  href={`/dashboard/assistant/attendance/${program.id}/history`}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  <span>!</span>
                  <span>View History</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">About Attendance</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>* Take daily attendance for active programs assigned to your coaches</li>
          <li>* Mark students as Present, Absent, Excused, or Late</li>
          <li>* View attendance history for past sessions</li>
          <li>* Your attendance records are linked to your account</li>
        </ul>
      </div>
    </div>
  );
}
