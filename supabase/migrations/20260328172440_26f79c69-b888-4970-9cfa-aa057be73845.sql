
-- Add destaque_ate column to anuncios
ALTER TABLE public.anuncios ADD COLUMN destaque_ate timestamptz DEFAULT NULL;

-- Create comissoes table
CREATE TABLE public.comissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frete_id uuid NOT NULL REFERENCES public.fretes(id) ON DELETE CASCADE,
  valor numeric NOT NULL DEFAULT 0,
  percentual numeric NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'pendente',
  stripe_payment_id text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can manage all comissoes
CREATE POLICY "Admins can manage comissoes" ON public.comissoes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Participants can view comissoes of their fretes
CREATE POLICY "Frete participants can view comissoes" ON public.comissoes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fretes f
      JOIN public.cargas c ON c.id = f.carga_id
      WHERE f.id = frete_id AND (f.motorista_id = auth.uid() OR c.contratante_id = auth.uid())
    )
  );

-- Create analytics function for Pro dashboard
CREATE OR REPLACE FUNCTION public.get_analytics_data(_user_id uuid)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'cargas_por_mes', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT date_trunc('month', created_at)::date AS mes, count(*)::int AS total
        FROM public.cargas
        WHERE contratante_id = _user_id
        GROUP BY 1 ORDER BY 1 DESC LIMIT 6
      ) t
    ),
    'fretes_por_mes', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT date_trunc('month', f.created_at)::date AS mes, count(*)::int AS total
        FROM public.fretes f
        JOIN public.cargas c ON c.id = f.carga_id
        WHERE f.motorista_id = _user_id OR c.contratante_id = _user_id
        GROUP BY 1 ORDER BY 1 DESC LIMIT 6
      ) t
    ),
    'valor_por_mes', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT date_trunc('month', f.created_at)::date AS mes, coalesce(sum(c.valor), 0)::numeric AS total
        FROM public.fretes f
        JOIN public.cargas c ON c.id = f.carga_id
        WHERE (f.motorista_id = _user_id OR c.contratante_id = _user_id) AND f.status = 'entregue'
        GROUP BY 1 ORDER BY 1 DESC LIMIT 6
      ) t
    )
  )
$$;
