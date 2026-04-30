
-- Enable Realtime on fretes and cargas tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.fretes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cargas;

-- Create storage bucket for anuncio images
INSERT INTO storage.buckets (id, name, public) VALUES ('anuncio-images', 'anuncio-images', true);

-- RLS policies for the storage bucket
CREATE POLICY "Authenticated users can upload anuncio images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'anuncio-images');

CREATE POLICY "Anyone can view anuncio images"
ON storage.objects FOR SELECT
USING (bucket_id = 'anuncio-images');

CREATE POLICY "Users can update own anuncio images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'anuncio-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own anuncio images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'anuncio-images' AND (storage.foldername(name))[1] = auth.uid()::text);
