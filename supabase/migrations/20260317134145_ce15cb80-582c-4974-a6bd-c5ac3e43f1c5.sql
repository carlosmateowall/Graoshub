
-- Add aguardando_confirmacao to frete_status enum
ALTER TYPE public.frete_status ADD VALUE IF NOT EXISTS 'aguardando_confirmacao' BEFORE 'entregue';

-- Create favoritos table
CREATE TABLE public.favoritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  anuncio_id uuid NOT NULL REFERENCES public.anuncios(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, anuncio_id)
);

ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.favoritos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.favoritos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favoritos FOR DELETE TO authenticated USING (auth.uid() = user_id);
