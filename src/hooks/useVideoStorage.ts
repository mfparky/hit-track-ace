import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

const BUCKET_NAME = 'swing-videos';

export function useVideoStorage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [storageAvailable, setStorageAvailable] = useState<boolean | null>(null);

  const checkBucket = async (): Promise<boolean> => {
    try {
      // Try a lightweight list to verify the bucket is accessible
      const { error } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 1 });
      if (error) {
        console.warn('Storage bucket not accessible:', error.message);
        setStorageAvailable(false);
        return false;
      }
      setStorageAvailable(true);
      return true;
    } catch {
      setStorageAvailable(false);
      return false;
    }
  };

  const uploadVideo = async (
    blob: Blob,
    playerId: string,
    mimeType: string
  ): Promise<string | null> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const available = await checkBucket();
      if (!available) {
        setUploadError('Video storage not configured. Video was not saved.');
        return null;
      }

      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const path = `${playerId}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, blob, { contentType: mimeType });

      if (error) {
        setUploadError(`Upload failed: ${error.message}`);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (err) {
      setUploadError('Upload failed. Check your connection.');
      console.error('Video upload error:', err);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteVideo = async (url: string): Promise<boolean> => {
    try {
      // Extract path from public URL
      const bucketPath = url.split(`${BUCKET_NAME}/`)[1];
      if (!bucketPath) return false;

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([bucketPath]);

      return !error;
    } catch {
      return false;
    }
  };

  return {
    uploadVideo,
    deleteVideo,
    isUploading,
    uploadError,
    storageAvailable,
    checkBucket,
  };
}
