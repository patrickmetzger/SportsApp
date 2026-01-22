'use client';

import Image from 'next/image';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

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
  const startDate = new Date(program.start_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endDate = new Date(program.end_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const deadline = new Date(program.registration_deadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <a
      href={`/programs/${program.id}`}
      className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 block overflow-hidden group"
    >
      {/* Image section */}
      {program.program_image_url ? (
        <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
          <Image
            src={program.program_image_url}
            alt={program.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] w-full bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center">
          <span className="text-teal-400 text-5xl font-bold">
            {program.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-teal-600 transition-colors mb-2">
            {program.name}
          </h3>
          <p className="text-slate-500 text-sm line-clamp-2">
            {program.description}
          </p>
        </div>

        {/* Details */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-slate-500">
            <CalendarIcon className="w-4 h-4" />
            <span>{startDate} - {endDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <ClockIcon className="w-4 h-4" />
            <span>Deadline: {deadline}</span>
          </div>
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div>
            <p className="text-2xl font-bold text-slate-900">
              ${program.cost.toFixed(0)}
            </p>
          </div>
          <span className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium group-hover:bg-teal-600 transition-colors">
            View Details
          </span>
        </div>
      </div>
    </a>
  );
}
