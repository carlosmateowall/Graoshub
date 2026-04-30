
-- Chat messages table
CREATE TABLE public.mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frete_id uuid NOT NULL REFERENCES public.fretes(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Motorista can read/write messages on their own fretes
CREATE POLICY "Motoristas can view messages of own fretes"
ON public.mensagens FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fretes
    WHERE fretes.id = mensagens.frete_id AND fretes.motorista_id = auth.uid()
  )
);

CREATE POLICY "Contratantes can view messages of own fretes"
ON public.mensagens FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fretes
    JOIN public.cargas ON cargas.id = fretes.carga_id
    WHERE fretes.id = mensagens.frete_id AND cargas.contratante_id = auth.uid()
  )
);

CREATE POLICY "Motoristas can insert messages on own fretes"
ON public.mensagens FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.fretes
    WHERE fretes.id = mensagens.frete_id AND fretes.motorista_id = auth.uid()
  )
);

CREATE POLICY "Contratantes can insert messages on own fretes"
ON public.mensagens FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.fretes
    JOIN public.cargas ON cargas.id = fretes.carga_id
    WHERE fretes.id = mensagens.frete_id AND cargas.contratante_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all messages"
ON public.mensagens FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
