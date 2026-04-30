
CREATE TYPE public.denuncia_tipo AS ENUM ('anuncio', 'usuario');

CREATE TABLE public.denuncias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  tipo denuncia_tipo NOT NULL,
  target_id UUID NOT NULL,
  motivo TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reports"
ON public.denuncias FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
ON public.denuncias FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all reports"
ON public.denuncias FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
