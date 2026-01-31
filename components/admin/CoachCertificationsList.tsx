'use client';

import { useState, useEffect } from 'react';
import { getCertificationStatus, formatCertificationStatus, getDaysUntilExpiry } from '@/lib/certifications';

interface CertificationType {
  id: string;
  name: string;
}

interface School {
  id: string;
  name: string;
}

interface Coach {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  school?: School | School[] | null;
}

interface Certification {
  id: string;
  certification_type_id: string;
  certificate_number: string | null;
  issuing_organization: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  document_url: string | null;
  created_at: string;
  certification_type?: CertificationType;
  coach?: Coach;
}

interface CoachCertificationsListProps {
  isSchoolAdmin?: boolean;
}

export default function CoachCertificationsList({ isSchoolAdmin = false }: CoachCertificationsListProps) {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchCertifications();
  }, [statusFilter]);

  const fetchCertifications = async () => {
    setLoading(true);
    try {
      const endpoint = isSchoolAdmin
        ? '/api/school-admin/coach-certifications'
        : '/api/admin/coach-certifications';

      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCertifications(data.certifications || []);
      }
    } catch (error) {
      console.error('Error fetching certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCoachName = (coach?: Coach) => {
    if (!coach) return 'Unknown Coach';
    if (coach.first_name && coach.last_name) {
      return `${coach.first_name} ${coach.last_name}`;
    }
    return coach.email;
  };

  const getSchoolName = (coach?: Coach) => {
    if (!coach?.school) return '-';
    const school = Array.isArray(coach.school) ? coach.school[0] : coach.school;
    return school?.name || '-';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  // Calculate summary stats
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const stats = {
    total: certifications.length,
    valid: certifications.filter(c => {
      if (!c.expiration_date) return true;
      return new Date(c.expiration_date) > thirtyDaysFromNow;
    }).length,
    expiring: certifications.filter(c => {
      if (!c.expiration_date) return false;
      const exp = new Date(c.expiration_date);
      return exp >= now && exp <= thirtyDaysFromNow;
    }).length,
    expired: certifications.filter(c => {
      if (!c.expiration_date) return false;
      return new Date(c.expiration_date) < now;
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`p-4 rounded-lg text-center transition ${
            statusFilter === '' ? 'bg-slate-700 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm">Total</div>
        </button>
        <button
          onClick={() => setStatusFilter('valid')}
          className={`p-4 rounded-lg text-center transition ${
            statusFilter === 'valid' ? 'bg-green-600 text-white' : 'bg-green-100 hover:bg-green-200 text-green-800'
          }`}
        >
          <div className="text-2xl font-bold">{stats.valid}</div>
          <div className="text-sm">Valid</div>
        </button>
        <button
          onClick={() => setStatusFilter('expiring')}
          className={`p-4 rounded-lg text-center transition ${
            statusFilter === 'expiring' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
          }`}
        >
          <div className="text-2xl font-bold">{stats.expiring}</div>
          <div className="text-sm">Expiring Soon</div>
        </button>
        <button
          onClick={() => setStatusFilter('expired')}
          className={`p-4 rounded-lg text-center transition ${
            statusFilter === 'expired' ? 'bg-red-600 text-white' : 'bg-red-100 hover:bg-red-200 text-red-800'
          }`}
        >
          <div className="text-2xl font-bold">{stats.expired}</div>
          <div className="text-sm">Expired</div>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : certifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No certifications found
          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="ml-2 text-blue-600 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coach
                </th>
                {!isSchoolAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {certifications.map((cert) => {
                const status = getCertificationStatus(cert.expiration_date);
                const statusDisplay = formatCertificationStatus(status);
                const daysUntil = getDaysUntilExpiry(cert.expiration_date);

                return (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getCoachName(cert.coach)}
                      </div>
                      <div className="text-xs text-gray-500">{cert.coach?.email}</div>
                    </td>
                    {!isSchoolAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getSchoolName(cert.coach)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cert.certification_type?.name || 'Unknown'}
                      </div>
                      {cert.issuing_organization && (
                        <div className="text-xs text-gray-500">{cert.issuing_organization}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(cert.issue_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(cert.expiration_date)}</div>
                      {daysUntil !== null && (
                        <div className={`text-xs ${daysUntil < 0 ? 'text-red-600' : daysUntil <= 30 ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {daysUntil < 0 ? `${Math.abs(daysUntil)} days ago` : daysUntil === 0 ? 'Today' : `in ${daysUntil} days`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                        {statusDisplay.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cert.document_url ? (
                        <a
                          href={cert.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
