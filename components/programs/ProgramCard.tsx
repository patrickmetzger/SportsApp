'use client';

import Image from 'next/image';

interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  cost: number;
  program_image_url: string | null;
  registration_deadline: string;
}

export default function ProgramCard({ program }: { program: Program }) {
  const startDate = new Date(program.start_date).toLocaleDateString();
  const endDate = new Date(program.end_date).toLocaleDateString();
  const deadline = new Date(program.registration_deadline).toLocaleDateString();

  return (
    <a
      href={`/programs/${program.id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      {program.program_image_url ? (
        <div className="relative h-48 w-full bg-gray-200">
          <Image
            src={program.program_image_url}
            alt={program.name}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-48 w-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          <span className="text-white text-4xl font-bold">
            {program.name.charAt(0)}
          </span>
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {program.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {program.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Duration:</span>
            <span className="font-medium">{startDate} - {endDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Deadline:</span>
            <span className="font-medium">{deadline}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-gray-500">Cost:</span>
            <span className="text-2xl font-bold text-blue-600">
              ${program.cost.toFixed(2)}
            </span>
          </div>
        </div>

        <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
          View Details & Register
        </button>
      </div>
    </a>
  );
}
