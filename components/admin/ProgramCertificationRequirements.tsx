'use client';

import { useState, useEffect } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/solid';

interface CertificationType {
  id: string;
  name: string;
  description: string | null;
  is_universal: boolean;
  validity_period_months: number;
  school_id: string | null;
}

interface Requirement {
  certification_type_id: string;
  is_required: boolean;
  locked_by_admin?: boolean;
}

interface ProgramCertificationRequirementsProps {
  programId: string;
  isSchoolAdmin?: boolean;
  isCoach?: boolean;
  schoolId?: string | null;
  onRequirementsChange?: (requirements: Requirement[]) => void;
}

export default function ProgramCertificationRequirements({
  programId,
  isSchoolAdmin = false,
  isCoach = false,
  schoolId,
  onRequirementsChange,
}: ProgramCertificationRequirementsProps) {
  const [certTypes, setCertTypes] = useState<CertificationType[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Can this user lock/unlock requirements?
  const canLock = !isCoach; // Admins and school admins can lock

  useEffect(() => {
    loadData();
  }, [programId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load certification types based on user role
      let typesEndpoint: string;
      if (isCoach) {
        typesEndpoint = '/api/coach/certification-types';
      } else if (isSchoolAdmin) {
        typesEndpoint = '/api/school-admin/certification-types';
      } else {
        typesEndpoint = '/api/admin/certification-types';
      }
      const typesRes = await fetch(typesEndpoint);
      const typesData = await typesRes.json();

      if (typesRes.ok) {
        setCertTypes(typesData.certificationTypes || []);
      }

      // Load existing requirements based on user role
      let reqsEndpoint: string;
      if (isCoach) {
        reqsEndpoint = `/api/coach/programs/${programId}/certification-requirements`;
      } else if (isSchoolAdmin) {
        reqsEndpoint = `/api/school-admin/programs/${programId}/certification-requirements`;
      } else {
        reqsEndpoint = `/api/admin/programs/${programId}/certification-requirements`;
      }
      const reqsRes = await fetch(reqsEndpoint);
      const reqsData = await reqsRes.json();

      if (reqsRes.ok) {
        const existingReqs = (reqsData.requirements || []).map((r: { certification_type_id: string; is_required: boolean; locked_by_admin?: boolean }) => ({
          certification_type_id: r.certification_type_id,
          is_required: r.is_required,
          locked_by_admin: r.locked_by_admin ?? false,
        }));
        setRequirements(existingReqs);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRequirement = (certTypeId: string) => {
    // Check if this requirement is locked (coaches can't modify locked ones)
    const existing = requirements.find((r) => r.certification_type_id === certTypeId);
    if (isCoach && existing?.locked_by_admin) {
      return; // Can't modify locked requirements
    }

    setRequirements((prev) => {
      if (existing) {
        // Remove requirement
        const newReqs = prev.filter((r) => r.certification_type_id !== certTypeId);
        onRequirementsChange?.(newReqs);
        return newReqs;
      } else {
        // Add as required by default
        const newReqs = [...prev, { certification_type_id: certTypeId, is_required: true, locked_by_admin: false }];
        onRequirementsChange?.(newReqs);
        return newReqs;
      }
    });
    setSuccess('');
  };

  const handleToggleRequired = (certTypeId: string) => {
    // Check if this requirement is locked
    const existing = requirements.find((r) => r.certification_type_id === certTypeId);
    if (isCoach && existing?.locked_by_admin) {
      return; // Can't modify locked requirements
    }

    setRequirements((prev) => {
      const newReqs = prev.map((r) => {
        if (r.certification_type_id === certTypeId) {
          return { ...r, is_required: !r.is_required };
        }
        return r;
      });
      onRequirementsChange?.(newReqs);
      return newReqs;
    });
    setSuccess('');
  };

  const handleToggleLocked = (certTypeId: string) => {
    if (!canLock) return;

    setRequirements((prev) => {
      const newReqs = prev.map((r) => {
        if (r.certification_type_id === certTypeId) {
          return { ...r, locked_by_admin: !r.locked_by_admin };
        }
        return r;
      });
      onRequirementsChange?.(newReqs);
      return newReqs;
    });
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let endpoint: string;
      if (isCoach) {
        endpoint = `/api/coach/programs/${programId}/certification-requirements`;
      } else if (isSchoolAdmin) {
        endpoint = `/api/school-admin/programs/${programId}/certification-requirements`;
      } else {
        endpoint = `/api/admin/programs/${programId}/certification-requirements`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements }),
      });

      if (res.ok) {
        setSuccess('Requirements saved successfully');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save requirements');
    } finally {
      setSaving(false);
    }
  };

  const isSelected = (certTypeId: string) => {
    return requirements.some((r) => r.certification_type_id === certTypeId);
  };

  const isRequiredCert = (certTypeId: string) => {
    const req = requirements.find((r) => r.certification_type_id === certTypeId);
    return req?.is_required ?? true;
  };

  const isLockedCert = (certTypeId: string) => {
    const req = requirements.find((r) => r.certification_type_id === certTypeId);
    return req?.locked_by_admin ?? false;
  };

  if (loading) {
    return (
      <div className="animate-pulse p-4">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Separate universal and non-universal types
  const universalTypes = certTypes.filter((t) => t.is_universal);
  const regularTypes = certTypes.filter((t) => !t.is_universal);

  // For coaches, separate locked requirements
  const lockedRequirements = requirements.filter((r) => r.locked_by_admin);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Universal certifications (auto-applies) */}
      {universalTypes.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Universal Certifications (applies to all programs)</h4>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex flex-wrap gap-2">
              {universalTypes.map((type) => (
                <span
                  key={type.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                >
                  <LockClosedIcon className="w-3 h-3 mr-1" />
                  {type.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Locked requirements (shown to coaches as non-editable) */}
      {isCoach && lockedRequirements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Required by Administration (cannot be removed)
          </h4>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex flex-wrap gap-2">
              {lockedRequirements.map((req) => {
                const type = certTypes.find((t) => t.id === req.certification_type_id);
                return (
                  <span
                    key={req.certification_type_id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800"
                  >
                    <LockClosedIcon className="w-3 h-3 mr-1" />
                    {type?.name}
                    {req.is_required ? ' (Required)' : ' (Recommended)'}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Regular certifications */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Program-Specific Certifications</h4>
        {regularTypes.length === 0 ? (
          <p className="text-sm text-gray-500">No certification types available.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            {regularTypes.map((type) => {
              const isLocked = isLockedCert(type.id);
              const isDisabled = isCoach && isLocked;

              // For coaches, skip showing locked items in this list (they're shown above)
              if (isCoach && isLocked) {
                return null;
              }

              return (
                <div key={type.id} className={`p-3 flex items-center justify-between ${isDisabled ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected(type.id)}
                      onChange={() => handleToggleRequirement(type.id)}
                      disabled={isDisabled}
                      className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {type.name}
                        {isLocked && <LockClosedIcon className="w-3 h-3 inline ml-1 text-amber-600" />}
                      </span>
                      {type.description && (
                        <p className="text-xs text-gray-500">{type.description}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Valid for {type.validity_period_months} months
                        {!type.school_id && ' • Global'}
                      </p>
                    </div>
                  </div>
                  {isSelected(type.id) && (
                    <div className="flex items-center gap-3">
                      <label className={`text-xs text-gray-600 ${isDisabled ? 'opacity-50' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isRequiredCert(type.id)}
                          onChange={() => handleToggleRequired(type.id)}
                          disabled={isDisabled}
                          className="mr-1 h-3 w-3 text-blue-600 border-gray-300 rounded"
                        />
                        Required
                      </label>
                      {!isRequiredCert(type.id) && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                          Recommended
                        </span>
                      )}
                      {/* Lock toggle for admins */}
                      {canLock && (
                        <button
                          type="button"
                          onClick={() => handleToggleLocked(type.id)}
                          className={`p-1 rounded transition ${
                            isLocked
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                          }`}
                          title={isLocked ? 'Unlock (allow coaches to modify)' : 'Lock (prevent coaches from removing)'}
                        >
                          <LockClosedIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected summary */}
      {requirements.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Selected Requirements</h4>
          <div className="flex flex-wrap gap-2">
            {requirements.map((req) => {
              const type = certTypes.find((t) => t.id === req.certification_type_id);
              return (
                <span
                  key={req.certification_type_id}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    req.is_required
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {req.locked_by_admin && <LockClosedIcon className="w-3 h-3 mr-1" />}
                  {type?.name}
                  {req.is_required ? ' (Required)' : ' (Recommended)'}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Requirements'}
      </button>
    </div>
  );
}
