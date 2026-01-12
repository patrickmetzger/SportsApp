'use client';

import { useState } from 'react';
import { uploadImageFromBrowser } from '@/lib/storage';
import Image from 'next/image';

interface ImageUploadProps {
  currentImageUrl: string;
  onUploadComplete: (url: string) => void;
  folder: 'headers' | 'programs';
}

export default function ImageUpload({
  currentImageUrl,
  onUploadComplete,
  folder,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Upload to Supabase Storage
      const publicUrl = await uploadImageFromBrowser(file, folder);

      onUploadComplete(publicUrl);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setPreviewUrl(currentImageUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onUploadComplete('');
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 text-red-600 p-2 rounded text-sm">
          {error}
        </div>
      )}

      {previewUrl ? (
        <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
          <div className="relative h-48 w-full">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id={`upload-${folder}`}
          />
          <label
            htmlFor={`upload-${folder}`}
            className="cursor-pointer block"
          >
            {uploading ? (
              <div className="text-blue-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                <p>Uploading...</p>
              </div>
            ) : (
              <div className="text-gray-600">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-2">Click to upload image</p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
