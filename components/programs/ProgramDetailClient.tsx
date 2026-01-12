'use client';

import { useState } from 'react';
import ContactCoachForm from './ContactCoachForm';

interface Coach {
  users: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  role: string;
}

interface ProgramDetailClientProps {
  programId: string;
  programName: string;
  coaches: Coach[];
}

export default function ProgramDetailClient({
  programId,
  programName,
  coaches,
}: ProgramDetailClientProps) {
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  return (
    <>
      <div className="space-y-3">
        {coaches.map((pc: Coach, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">
                {pc.users.first_name} {pc.users.last_name}
              </p>
              <p className="text-sm text-gray-500 capitalize">{pc.role}</p>
            </div>
            <button
              onClick={() => setSelectedCoach(pc)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Contact
            </button>
          </div>
        ))}
      </div>

      {/* Contact Form Modal */}
      {selectedCoach && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Contact {selectedCoach.users.first_name} {selectedCoach.users.last_name}
                </h2>
                <button
                  onClick={() => setSelectedCoach(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <ContactCoachForm
                programId={programId}
                programName={programName}
                coachEmail={selectedCoach.users.email}
                coachName={`${selectedCoach.users.first_name} ${selectedCoach.users.last_name}`}
                onClose={() => setSelectedCoach(null)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
