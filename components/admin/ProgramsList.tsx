'use client';

import { useRouter } from 'next/navigation';

interface Program {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  cost: number;
  created_at: string;
}

export default function ProgramsList({ programs }: { programs: Program[] | null }) {
  const router = useRouter();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/programs/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete program');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Program Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Dates
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Deadline
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Cost
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {programs?.map((program) => (
            <tr key={program.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {program.name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(program.start_date).toLocaleDateString()} -{' '}
                {new Date(program.end_date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(program.registration_deadline).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                ${program.cost.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                <a
                  href={`/programs/${program.id}`}
                  className="text-blue-600 hover:text-blue-900"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </a>
                <a
                  href={`/admin/programs/${program.id}/registrations`}
                  className="text-green-600 hover:text-green-900"
                >
                  Registrations
                </a>
                <a
                  href={`/admin/programs/${program.id}/eligible-students`}
                  className="text-purple-600 hover:text-purple-900"
                >
                  Eligible
                </a>
                <a
                  href={`/admin/programs/${program.id}/edit`}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Edit
                </a>
                <button
                  onClick={() => handleDelete(program.id, program.name)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!programs || programs.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          No programs found. Create your first program!
        </div>
      ) : null}
    </div>
  );
}
