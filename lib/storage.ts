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
