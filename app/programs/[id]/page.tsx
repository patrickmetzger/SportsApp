import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import RegistrationForm from '@/components/programs/RegistrationForm';
import ProgramQRCode from '@/components/programs/ProgramQRCode';
import ProgramDetailClient from '@/components/programs/ProgramDetailClient';

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch program details
  const { data: program, error: programError } = await supabase
    .from('summer_programs')
    .select('*')
    .eq('id', id)
    .single();

  if (programError || !program) {
    redirect('/programs');
  }

  // Fetch coaches for this program
  const { data: programCoachesData } = await supabase
    .from('program_coaches')
    .select(`
      role,
      users:coach_id (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('program_id', id);

  // Transform the data: Supabase returns users as array, but we need a single object
  const programCoaches = programCoachesData?.map((pc: any) => ({
    role: pc.role,
    users: Array.isArray(pc.users) ? pc.users[0] : pc.users
  }));

  const requirements = program.requirements as string[] || [];
  const startDate = new Date(program.start_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const endDate = new Date(program.end_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const deadline = new Date(program.registration_deadline).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isPastDeadline = new Date(program.registration_deadline) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      {program.header_image_url && (
        <div className="relative h-96 w-full">
          <Image
            src={program.header_image_url}
            alt={program.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {program.name}
              </h1>
              <p className="text-xl text-white/90">${program.cost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <a href="/programs" className="text-blue-600 hover:text-blue-800">
              ← Back to Programs
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Program Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Program Details
              </h2>
              <p className="text-gray-700 mb-6 whitespace-pre-line">
                {program.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-semibold text-gray-900">{startDate}</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-semibold text-gray-900">{endDate}</p>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <p className="text-sm text-gray-500">Registration Deadline</p>
                  <p className="font-semibold text-gray-900">{deadline}</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-gray-500">Program Cost</p>
                  <p className="font-semibold text-gray-900 text-2xl">
                    ${program.cost.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              {requirements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Requirements
                  </h3>
                  <ul className="space-y-2">
                    {requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Coaches Card */}
            {programCoaches && programCoaches.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Program Coaches
                </h2>
                <ProgramDetailClient
                  programId={program.id}
                  programName={program.name}
                  coaches={programCoaches}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* QR Code */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Share This Program
              </h3>
              <ProgramQRCode programId={program.id} />
              <p className="text-xs text-gray-500 text-center mt-2">
                Scan to view on mobile
              </p>
            </div>

            {/* Registration Form */}
            {isPastDeadline ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Registration Closed
                </h3>
                <p className="text-red-700">
                  The registration deadline has passed for this program.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Register Now
                </h3>
                <RegistrationForm programId={program.id} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
