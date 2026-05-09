'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/admin/ImageUpload';

interface CertificationType {
  id: string;
  name: string;
  description?: string;
  school_id?: string | null;
}

interface CertRequirement {
  certification_type_id: string;
  is_required: boolean;
  locked_by_admin: boolean;
}

interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  cost: number;
  header_image_url?: string;
  program_image_url?: string;
  min_grade?: number | null;
  max_grade?: number | null;
  min_age?: number | null;
  max_age?: number | null;
  gender_restriction?: string;
  eligibility_notes?: string;
  requirements?: any;
}

interface CoachProgramEditFormProps {
  program: Program;
  coachId: string;
}

export default function CoachProgramEditForm({ program, coachId }: CoachProgramEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Certification requirements state
  const [certTypes, setCertTypes] = useState<CertificationType[]>([]);
  const [certRequirements, setCertRequirements] = useState<CertRequirement[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(true);

  useEffect(() => {
    const fetchCerts = async () => {
      setLoadingCerts(true);
      try {
        const [typesRes, reqsRes] = await Promise.all([
          fetch('/api/coach/certification-types'),
          fetch(`/api/coach/programs/${program.id}/certification-requirements`),
        ]);
        if (typesRes.ok) {
          const data = await typesRes.json();
          setCertTypes(data.certificationTypes || []);
        }
        if (reqsRes.ok) {
          const data = await reqsRes.json();
          setCertRequirements(
            (data.requirements || []).map((r: any) => ({
              certification_type_id: r.certification_type_id,
              is_required: r.is_required,
              locked_by_admin: r.locked_by_admin,
            }))
          );
        }
      } catch {
        // Non-fatal — cert section will be empty
      } finally {
        setLoadingCerts(false);
      }
    };
    fetchCerts();
  }, [program.id]);

  // Hide global certs (school_id === null) — admins manage those, coaches can't touch them.
  // Also hide any cert the admin has explicitly locked on this program.
  const editableCertTypes = certTypes.filter(
    (ct) =>
      ct.school_id !== null &&
      !certRequirements.find((r) => r.certification_type_id === ct.id && r.locked_by_admin)
  );

  const getCertReq = (certTypeId: string) =>
    certRequirements.find((r) => r.certification_type_id === certTypeId);

  const toggleCert = (certTypeId: string) => {
    setCertRequirements((prev) => {
      const existing = prev.find((r) => r.certification_type_id === certTypeId);
      if (existing) return prev.filter((r) => r.certification_type_id !== certTypeId);
      return [...prev, { certification_type_id: certTypeId, is_required: true, locked_by_admin: false }];
    });
  };

  const toggleRequired = (certTypeId: string) => {
    setCertRequirements((prev) =>
      prev.map((r) =>
        r.certification_type_id === certTypeId ? { ...r, is_required: !r.is_required } : r
      )
    );
  };

  // Add new cert type inline
  const [newCertName, setNewCertName] = useState('');
  const [addingCert, setAddingCert] = useState(false);
  const [newCertError, setNewCertError] = useState('');

  const handleAddCertType = async () => {
    if (!newCertName.trim()) return;
    setAddingCert(true);
    setNewCertError('');
    try {
      const res = await fetch('/api/coach/certification-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCertName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create certification type');
      // Add to list and auto-select as required
      setCertTypes((prev) => [...prev, data.certificationTypes].sort((a, b) => a.name.localeCompare(b.name)));
      setCertRequirements((prev) => [
        ...prev,
        { certification_type_id: data.certificationTypes.id, is_required: true, locked_by_admin: false },
      ]);
      setNewCertName('');
    } catch (err: any) {
      setNewCertError(err.message);
    } finally {
      setAddingCert(false);
    }
  };

  const [formData, setFormData] = useState({
    name: program.name,
    description: program.description || '',
    start_date: program.start_date,
    end_date: program.end_date,
    registration_deadline: program.registration_deadline,
    cost: program.cost,
    header_image_url: program.header_image_url || '',
    program_image_url: program.program_image_url || '',
    min_grade: program.min_grade?.toString() || '',
    max_grade: program.max_grade?.toString() || '',
    min_age: program.min_age?.toString() || '',
    max_age: program.max_age?.toString() || '',
    gender_restriction: program.gender_restriction || 'any',
    eligibility_notes: program.eligibility_notes || '',
  });

  const dateError = (() => {
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date)
      return 'End date must be after start date.';
    if (formData.start_date && formData.registration_deadline && formData.registration_deadline > formData.start_date)
      return 'Registration deadline must be on or before the start date.';
    return null;
  })();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: name === 'cost' ? parseFloat(value) || 0 : value };
      // Clear end_date if start_date is pushed past it
      if (name === 'start_date' && prev.end_date && value && prev.end_date < value) {
        next.end_date = '';
      }
      return next;
    });
  };

  const handleImageUpload = (field: 'header_image_url' | 'program_image_url') => (url: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: url
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dateError) return;
    setError('');
    setLoading(true);

    try {
      const [programRes, certsRes] = await Promise.all([
        fetch('/api/coach/programs/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: program.id,
            name: formData.name,
            description: formData.description,
            start_date: formData.start_date,
            end_date: formData.end_date,
            registration_deadline: formData.registration_deadline,
            cost: formData.cost,
            header_image_url: formData.header_image_url,
            program_image_url: formData.program_image_url,
            min_grade: formData.min_grade ? parseInt(formData.min_grade) : null,
            max_grade: formData.max_grade ? parseInt(formData.max_grade) : null,
            min_age: formData.min_age ? parseInt(formData.min_age) : null,
            max_age: formData.max_age ? parseInt(formData.max_age) : null,
            gender_restriction: formData.gender_restriction,
            eligibility_notes: formData.eligibility_notes,
          }),
        }),
        fetch(`/api/coach/programs/${program.id}/certification-requirements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requirements: certRequirements
              .filter((r) => !r.locked_by_admin)
              .map((r) => ({
                certification_type_id: r.certification_type_id,
                is_required: r.is_required,
              })),
          }),
        }),
      ]);

      const programData = await programRes.json();
      if (!programRes.ok) throw new Error(programData.error || 'Failed to update program');

      const certsData = await certsRes.json();
      if (!certsRes.ok) throw new Error(certsData.error || 'Failed to save certification requirements');

      router.push('/dashboard/coach');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 school-branded-card">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Program Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Program Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe the program..."
        />
      </div>

      {/* Dates */}
      {dateError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg">
          {dateError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            min={formData.start_date || undefined}
            onChange={handleChange}
            required
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              formData.start_date && formData.end_date && formData.end_date < formData.start_date
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300'
            }`}
          />
        </div>

        <div>
          <label htmlFor="registration_deadline" className="block text-sm font-medium text-gray-700 mb-2">
            Registration Deadline *
          </label>
          <input
            type="date"
            id="registration_deadline"
            name="registration_deadline"
            value={formData.registration_deadline}
            max={formData.start_date || undefined}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Cost */}
      <div>
        <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
          Program Cost ($) *
        </label>
        <input
          type="number"
          id="cost"
          name="cost"
          value={formData.cost}
          onChange={handleChange}
          min="0"
          step="0.01"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Eligibility Criteria */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Eligibility Criteria</h2>
        <p className="text-sm text-gray-600 mb-4">
          Set requirements for who can register for this program. Leave fields empty for no restriction.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="min_grade" className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Grade
            </label>
            <input
              type="number"
              id="min_grade"
              name="min_grade"
              value={formData.min_grade}
              onChange={handleChange}
              min="1"
              max="12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 9"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
          </div>

          <div>
            <label htmlFor="max_grade" className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Grade
            </label>
            <input
              type="number"
              id="max_grade"
              name="max_grade"
              value={formData.max_grade}
              onChange={handleChange}
              min="1"
              max="12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 12"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no maximum</p>
          </div>

          <div>
            <label htmlFor="min_age" className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Age
            </label>
            <input
              type="number"
              id="min_age"
              name="min_age"
              value={formData.min_age}
              onChange={handleChange}
              min="1"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 14"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
          </div>

          <div>
            <label htmlFor="max_age" className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Age
            </label>
            <input
              type="number"
              id="max_age"
              name="max_age"
              value={formData.max_age}
              onChange={handleChange}
              min="1"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 18"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no maximum</p>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="gender_restriction" className="block text-sm font-medium text-gray-700 mb-2">
              Gender Restriction
            </label>
            <select
              id="gender_restriction"
              name="gender_restriction"
              value={formData.gender_restriction}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="any">Any Gender</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="eligibility_notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Eligibility Notes
            </label>
            <textarea
              id="eligibility_notes"
              name="eligibility_notes"
              value={formData.eligibility_notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any other eligibility requirements or notes..."
            />
          </div>
        </div>
      </div>

      {/* Certification Requirements */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Certification Requirements</h2>
        <p className="text-sm text-gray-500 mb-4">
          Select certifications coaches must hold to be assigned to this program. Click the badge to toggle between Required and Recommended.
        </p>

        {loadingCerts ? (
          <p className="text-sm text-gray-500">Loading certifications...</p>
        ) : (
          <div className="space-y-2">
            {editableCertTypes.length === 0 && (
              <p className="text-sm text-gray-500">No certification types available — add one below.</p>
            )}
            {editableCertTypes.map((ct) => {
              const req = getCertReq(ct.id);
              const isSelected = !!req;

              return (
                <div
                  key={ct.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCert(ct.id)}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{ct.name}</span>
                      {ct.description && (
                        <p className="text-xs text-gray-500">{ct.description}</p>
                      )}
                    </div>
                  </label>

                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => toggleRequired(ct.id)}
                      className={`ml-4 px-2.5 py-1 text-xs font-medium rounded-full transition ${
                        req?.is_required
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      {req?.is_required ? 'Required' : 'Recommended'}
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add new certification type */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Don't see the certification you need?</p>
              {newCertError && (
                <p className="text-xs text-red-600 mb-2">{newCertError}</p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCertName}
                  onChange={(e) => setNewCertName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertType())}
                  placeholder="New certification name..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddCertType}
                  disabled={addingCert || !newCertName.trim()}
                  className="px-4 py-2 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 transition"
                >
                  {addingCert ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Images */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Header Image
            </label>
            <ImageUpload
              currentImageUrl={formData.header_image_url}
              onUploadComplete={handleImageUpload('header_image_url')}
              folder="headers"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program Card Image
            </label>
            <ImageUpload
              currentImageUrl={formData.program_image_url}
              onUploadComplete={handleImageUpload('program_image_url')}
              folder="programs"
            />
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={loading || !!dateError}
          className="flex-1 school-branded-btn-primary py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <a
          href="/dashboard/coach"
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-center"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
