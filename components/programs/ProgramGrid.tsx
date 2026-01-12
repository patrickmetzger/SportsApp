'use client';

import ProgramCard from './ProgramCard';

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

export default function ProgramGrid({ programs }: { programs: Program[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {programs.map((program) => (
        <ProgramCard key={program.id} program={program} />
      ))}
    </div>
  );
}
