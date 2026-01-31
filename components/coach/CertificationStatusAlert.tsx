'use client';

import { useEffect, useState } from 'react';

interface ComplianceStatus {
  programName: string;
  missingRequired: { name: string }[];
  expiringCerts: { certification_type?: { name: string }; expiration_date: string }[];
}

interface Summary {
  isCompliant: boolean;
  totalMissingRequired: number;
  totalExpiringCerts: number;
}

export default function CertificationStatusAlert() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [programs, setPrograms] = useState<ComplianceStatus[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/coach/certifications/status');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setPrograms(data.programs);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Don't show loading state to avoid layout shift
  }

  if (!summary || (summary.isCompliant && summary.totalExpiringCerts === 0)) {
    return null; // No issues to display
  }

  const hasIssues = !summary.isCompliant || summary.totalExpiringCerts > 0;

  if (!hasIssues) {
    return null;
  }

  return (
    <div className={`rounded-lg p-4 mb-6 ${
      !summary.isCompliant ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${!summary.isCompliant ? 'text-red-500' : 'text-yellow-500'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className={`font-semibold ${!summary.isCompliant ? 'text-red-800' : 'text-yellow-800'}`}>
            {!summary.isCompliant ? 'Certification Action Required' : 'Certifications Expiring Soon'}
          </h3>

          <div className={`text-sm mt-1 ${!summary.isCompliant ? 'text-red-700' : 'text-yellow-700'}`}>
            {summary.totalMissingRequired > 0 && (
              <p>You have {summary.totalMissingRequired} missing required certification{summary.totalMissingRequired > 1 ? 's' : ''}.</p>
            )}
            {summary.totalExpiringCerts > 0 && (
              <p>{summary.totalExpiringCerts} certification{summary.totalExpiringCerts > 1 ? 's are' : ' is'} expiring soon or expired.</p>
            )}
          </div>

          {/* Toggle details */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`text-sm mt-2 underline ${!summary.isCompliant ? 'text-red-600' : 'text-yellow-600'}`}
          >
            {expanded ? 'Hide details' : 'Show details'}
          </button>

          {/* Expanded details */}
          {expanded && (
            <div className="mt-3 space-y-3">
              {programs.map((program, index) => {
                const hasMissing = program.missingRequired.length > 0;
                const hasExpiring = program.expiringCerts.length > 0;

                if (!hasMissing && !hasExpiring) return null;

                return (
                  <div key={index} className="bg-white/50 rounded p-3">
                    <h4 className="font-medium text-gray-900">{program.programName}</h4>

                    {hasMissing && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-red-600 uppercase">Missing Required:</p>
                        <ul className="mt-1 text-sm text-gray-700">
                          {program.missingRequired.map((cert, i) => (
                            <li key={i}>• {cert.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {hasExpiring && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-yellow-600 uppercase">Expiring/Expired:</p>
                        <ul className="mt-1 text-sm text-gray-700">
                          {program.expiringCerts.map((cert, i) => {
                            const expDate = new Date(cert.expiration_date);
                            const now = new Date();
                            const isExpired = expDate < now;
                            return (
                              <li key={i}>
                                • {cert.certification_type?.name || 'Unknown'} - {' '}
                                <span className={isExpired ? 'text-red-600' : 'text-yellow-600'}>
                                  {isExpired ? 'Expired' : 'Expires'} {expDate.toLocaleDateString()}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action button */}
        <a
          href="/dashboard/coach/certifications"
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition ${
            !summary.isCompliant
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          }`}
        >
          Manage Certifications
        </a>
      </div>
    </div>
  );
}
