'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CertificationType {
  id: string;
  name: string;
  description: string | null;
  school_id: string | null;
  is_universal: boolean;
  validity_period_months: number;
  created_at: string;
  school?: { id: string; name: string } | null;
}

interface CertificationTypesListProps {
  certificationTypes: CertificationType[];
  isSchoolAdmin?: boolean;
  schoolId?: string | null;
}

export default function CertificationTypesList({
  certificationTypes,
  isSchoolAdmin = false,
  schoolId,
}: CertificationTypesListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, isGlobal: boolean) => {
    if (isSchoolAdmin && isGlobal) {
      alert('Cannot delete global certification types');
      return;
    }

    if (!confirm('Are you sure you want to delete this certification type? This may affect coach certifications.')) {
      return;
    }

    setDeleting(id);
    try {
      const endpoint = isSchoolAdmin
        ? `/api/school-admin/certification-types/${id}`
        : `/api/admin/certification-types/${id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
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

  const canEdit = (type: CertificationType) => {
    if (!isSchoolAdmin) return true; // Admins can edit all
    return type.school_id === schoolId; // School admins can only edit their types
  };

  const canDelete = (type: CertificationType) => {
    if (!isSchoolAdmin) return true; // Admins can delete all
    return type.school_id === schoolId; // School admins can only delete their types
  };

  if (certificationTypes.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No certification types found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Scope
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Validity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Universal
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {certificationTypes.map((type) => {
            const isGlobal = !type.school_id;
            return (
              <tr key={type.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{type.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">
                    {type.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isGlobal ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Global
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {type.school?.name || 'School-specific'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {type.validity_period_months} months
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {type.is_universal ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Yes
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">No</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit(type) && (
                    <a
                      href={isSchoolAdmin
                        ? `/school-admin/certification-types/${type.id}/edit`
                        : `/admin/certification-types/${type.id}/edit`
                      }
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </a>
                  )}
                  {canDelete(type) && (
                    <button
                      onClick={() => handleDelete(type.id, isGlobal)}
                      disabled={deleting === type.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {deleting === type.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                  {!canEdit(type) && !canDelete(type) && (
                    <span className="text-gray-400 text-xs">Read only</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
