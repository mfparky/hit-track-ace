
-- Create the swing-videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('swing-videos', 'swing-videos', true, 52428800);

-- Allow anyone to upload videos
CREATE POLICY "Anyone can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'swing-videos');

-- Allow anyone to view videos
CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'swing-videos');

-- Allow anyone to delete videos
CREATE POLICY "Anyone can delete videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'swing-videos');
