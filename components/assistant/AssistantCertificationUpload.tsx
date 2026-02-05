'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CameraCapture from '@/components/coach/CameraCapture';
import { extractDatesFromImage, formatExtractedData, type ExtractedDates } from '@/lib/ocr';
import { uploadCertification } from '@/lib/storage';

interface CertificationType {
  id: string;
  name: string;
  description: string | null;
  validity_period_months: number;
}

interface AssistantCertificationUploadProps {
  certificationTypes: CertificationType[];
}

export default function AssistantCertificationUpload({ certificationTypes }: AssistantCertificationUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [ocrResult, setOcrResult] = useState<ExtractedDates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    certification_type_id: '',
    certificate_number: '',
    issuing_organization: '',
    issue_date: '',
    expiration_date: '',
  });

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleCameraCapture = async (file: File) => {
    setShowCamera(false);
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setError('');
    setSelectedFile(file);

    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    const preview = URL.createObjectURL(file);
    setFilePreview(preview);

    if (file.type.startsWith('image/')) {
      setOcrProgress(0);
      try {
        const result = await extractDatesFromImage(file, setOcrProgress);
        setOcrResult(result);

        if (result.issueDate && !formData.issue_date) {
          setFormData(prev => ({ ...prev, issue_date: result.issueDate || '' }));
        }
        if (result.expirationDate && !formData.expiration_date) {
          setFormData(prev => ({ ...prev, expiration_date: result.expirationDate || '' }));
        }
      } catch (err) {
        console.error('OCR error:', err);
      } finally {
        setOcrProgress(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.certification_type_id) {
        throw new Error('Please select a certification type');
      }

      let documentUrl = '';
      let documentOriginalName = '';

      if (selectedFile) {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();

        if (!userData.user?.id) {
          throw new Error('Unable to get user ID');
        }

        const uploadResult = await uploadCertification(selectedFile, userData.user.id);
        documentUrl = uploadResult.url;
        documentOriginalName = uploadResult.originalName;
      }

      const res = await fetch('/api/coach/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          document_url: documentUrl,
          document_original_name: documentOriginalName,
          ocr_extracted_data: ocrResult ? formatExtractedData(ocrResult) : {},
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save certification');
      }

      router.push('/dashboard/assistant/certifications');
      router.refresh();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save certification');
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    setOcrResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Certification Type */}
        <div>
          <label htmlFor="certification_type_id" className="block text-sm font-medium text-gray-700 mb-1">
            Certification Type <span className="text-red-500">*</span>
          </label>
          <select
            id="certification_type_id"
            value={formData.certification_type_id}
            onChange={(e) => setFormData({ ...formData, certification_type_id: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Select a certification type</option>
            {certificationTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Certification Document
          </label>

          {!selectedFile ? (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">Choose File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-600">Take Photo</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/heic,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <p className="text-xs text-gray-500 text-center">
                Supported formats: JPEG, PNG, HEIC, PDF (max 10MB)
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative border rounded-lg overflow-hidden">
                {filePreview && selectedFile?.type.startsWith('image/') && (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto object-contain"
                  />
                )}
                {selectedFile?.type === 'application/pdf' && (
                  <div className="p-8 text-center bg-gray-50">
                    <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">{selectedFile.name}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {ocrProgress !== null && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-blue-700">Scanning for dates...</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {ocrResult && (ocrResult.issueDate || ocrResult.expirationDate) && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Dates detected and auto-filled</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Certificate Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="certificate_number" className="block text-sm font-medium text-gray-700 mb-1">
              Certificate Number
            </label>
            <input
              type="text"
              id="certificate_number"
              value={formData.certificate_number}
              onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., CPR-12345"
            />
          </div>

          <div>
            <label htmlFor="issuing_organization" className="block text-sm font-medium text-gray-700 mb-1">
              Issuing Organization
            </label>
            <input
              type="text"
              id="issuing_organization"
              value={formData.issuing_organization}
              onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., American Red Cross"
            />
          </div>

          <div>
            <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 mb-1">
              Issue Date
            </label>
            <input
              type="date"
              id="issue_date"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="expiration_date" className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date
            </label>
            <input
              type="date"
              id="expiration_date"
              value={formData.expiration_date}
              onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Certification'}
          </button>
          <a
            href="/dashboard/assistant/certifications"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </a>
        </div>
      </form>
    </>
  );
}
