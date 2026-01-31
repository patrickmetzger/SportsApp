import { supabase } from './supabase/client';

// Client-side storage utilities
export async function uploadImageFromBrowser(
  file: File,
  folder: 'headers' | 'programs'
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('program-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('program-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteImage(url: string): Promise<void> {
  const path = url.split('/program-images/')[1];

  if (path) {
    await supabase.storage.from('program-images').remove([path]);
  }
}

// Upload certification document to coach-certifications bucket
export async function uploadCertification(
  file: File,
  coachId: string
): Promise<{ url: string; originalName: string }> {
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'heic', 'pdf'];

  if (!fileExt || !allowedExtensions.includes(fileExt)) {
    throw new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
  }

  // 10MB limit
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB limit');
  }

  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const fileName = `${coachId}/${timestamp}-${randomStr}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('coach-certifications')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get signed URL for private bucket (valid for 1 year)
  const { data, error: urlError } = await supabase.storage
    .from('coach-certifications')
    .createSignedUrl(fileName, 60 * 60 * 24 * 365);

  if (urlError || !data?.signedUrl) {
    throw new Error('Failed to generate document URL');
  }

  return {
    url: data.signedUrl,
    originalName: file.name,
  };
}

// Delete certification document
export async function deleteCertificationDocument(url: string): Promise<void> {
  // Extract path from signed URL
  const match = url.match(/coach-certifications\/([^?]+)/);
  const path = match?.[1];

  if (path) {
    await supabase.storage.from('coach-certifications').remove([path]);
  }
}

// Get a fresh signed URL for a certification document
export async function getCertificationUrl(
  coachId: string,
  filename: string
): Promise<string | null> {
  const path = `${coachId}/${filename}`;

  const { data, error } = await supabase.storage
    .from('coach-certifications')
    .createSignedUrl(path, 60 * 60 * 24); // 24 hours

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
