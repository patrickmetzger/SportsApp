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

export default function CoachRequiredTasksBanner() {
  const pathname = usePathname();
  const [rejectedPrograms, setRejectedPrograms] = useState<RejectedProgram[]>([]);
  const [certSummary, setCertSummary] = useState<CertSummary | null>(null);

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
      }
    });
  }, []);

  const hasCertIssues = certSummary && !certSummary.isCompliant;
  const isOnDashboard = pathname === '/dashboard/coach';

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
        <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <ShieldExclamationIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-amber-900">
              {certSummary!.totalMissingRequired > 0
                ? `${certSummary!.totalMissingRequired} required certification${certSummary!.totalMissingRequired !== 1 ? 's' : ''} missing`
                : `${certSummary!.totalExpiringCerts} certification${certSummary!.totalExpiringCerts !== 1 ? 's' : ''} expiring soon`}
            </span>
          </div>
          <a
            href="/dashboard/coach/certifications"
            className="flex-shrink-0 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            View Certs
          </a>
        </div>
      )}
    </div>
  );
}
