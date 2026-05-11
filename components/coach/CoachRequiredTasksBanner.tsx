'use client';

import { useEffect, useState } from 'react';
import { ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';

interface RejectedProgram {
  id: string;
  name: string;
  rejection_reason?: string | null;
}

interface CertSummary {
  isCompliant: boolean;
  totalMissingRequired: number;
  totalExpiringCerts: number;
}

interface CertProgramStatus {
  programName: string;
  missingRequired: { name: string }[];
  expiringCerts: { certification_type?: { name: string }; expiration_date: string }[];
}

export default function CoachRequiredTasksBanner() {
  const pathname = usePathname();
  const [rejectedPrograms, setRejectedPrograms] = useState<RejectedProgram[]>([]);
  const [certSummary, setCertSummary] = useState<CertSummary | null>(null);
  const [certPrograms, setCertPrograms] = useState<CertProgramStatus[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/coach/programs').then(r => r.ok ? r.json() : null),
      fetch('/api/coach/certifications/status').then(r => r.ok ? r.json() : null),
    ]).then(([programsData, certData]) => {
      if (programsData?.programs) {
        setRejectedPrograms(
          programsData.programs.filter((p: any) => p.status === 'rejected')
        );
      }
      if (certData?.summary) {
        setCertSummary(certData.summary);
        setCertPrograms(certData.programs || []);
      }
    });
  }, []);

  const hasCertIssues = certSummary && !certSummary.isCompliant;
  const programsWithMissing = certPrograms.filter(p => p.missingRequired.length > 0);
  const programsWithExpiring = certPrograms.filter(p => p.expiringCerts.length > 0);
  const isOnDashboard = pathname === '/dashboard/coach';
  const isOnCertsPage = pathname.startsWith('/dashboard/coach/certifications');

  // Nothing to show, or we're on the dashboard where tasks are already displayed inline
  if (isOnDashboard || (rejectedPrograms.length === 0 && !hasCertIssues)) return null;

  return (
    <div className="space-y-2 mb-6">
      {rejectedPrograms.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-sm font-semibold text-red-900">{p.name}</span>
              {p.rejection_reason && (
                <span className="text-sm text-red-700 ml-2 hidden sm:inline">— {p.rejection_reason}</span>
              )}
            </div>
          </div>
          <a
            href={`/dashboard/coach/programs/${p.id}/edit`}
            className="flex-shrink-0 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Edit & Resubmit
          </a>
        </div>
      ))}

      {hasCertIssues && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <ShieldExclamationIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-amber-900">Certification issues</span>
            </div>
            {!isOnCertsPage && (
              <a
                href="/dashboard/coach/certifications"
                className="flex-shrink-0 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                View Certs
              </a>
            )}
          </div>

          <div className="space-y-2 pl-7">
            {programsWithMissing.map((p) => (
              <div key={p.programName}>
                <p className="text-xs font-medium text-amber-800">{p.programName}</p>
                <ul className="mt-0.5 space-y-0.5">
                  {p.missingRequired.map((cert) => (
                    <li key={cert.name} className="text-xs text-amber-700 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                      {cert.name} <span className="text-amber-500 font-medium">required</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {programsWithExpiring.map((p) => (
              <div key={p.programName + '-expiring'}>
                {!programsWithMissing.find(m => m.programName === p.programName) && (
                  <p className="text-xs font-medium text-amber-800">{p.programName}</p>
                )}
                <ul className="mt-0.5 space-y-0.5">
                  {p.expiringCerts.map((cert, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                      {cert.certification_type?.name} <span className="text-amber-500 font-medium">expires {new Date(cert.expiration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
