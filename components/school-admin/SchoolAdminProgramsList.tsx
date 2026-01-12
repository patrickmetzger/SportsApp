'use client';

interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  cost: number;
  created_at: string;
}

interface SchoolAdminProgramsListProps {
  programs: Program[];
}

export default function SchoolAdminProgramsList({ programs }: SchoolAdminProgramsListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (programs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-4">📅</div>
        <p className="text-lg font-medium mb-2">No programs yet</p>
        <p className="text-sm">Create your first summer program to get started</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {programs.map((program) => (
        <div key={program.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{program.name}</h3>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{program.description}</p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Start Date:</span>
              <span className="font-medium text-gray-700">{formatDate(program.start_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">End Date:</span>
              <span className="font-medium text-gray-700">{formatDate(program.end_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Registration:</span>
              <span className="font-medium text-gray-700">{formatDate(program.registration_deadline)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cost:</span>
              <span className="font-medium text-green-600">{formatCurrency(program.cost)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <a
              href={`/school-admin/programs/${program.id}`}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Edit Program →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
