'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CertificationCard from './CertificationCard';

interface CertificationType {
  id: string;
  name: string;
  description: string | null;
}

interface Certification {
  id: string;
  certification_type_id: string;
  certificate_number: string | null;
  issuing_organization: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  document_url: string | null;
  document_original_name: string | null;
  created_at: string;
  certification_type?: CertificationType;
}

interface CertificationsListProps {
  certifications: Certification[];
}

export default function CertificationsList({ certifications }: CertificationsListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch(`/api/coach/certifications/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  if (certifications.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No certifications yet</h3>
        <p className="mt-1 text-gray-500">Get started by uploading your first certification.</p>
        <a
          href="/dashboard/coach/certifications/upload"
          className="mt-4 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
        >
          Upload Certification
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {certifications.map((cert) => (
        <CertificationCard
          key={cert.id}
          certification={cert}
          onDelete={handleDelete}
          deleting={deleting === cert.id}
        />
      ))}
    </div>
  );
}
