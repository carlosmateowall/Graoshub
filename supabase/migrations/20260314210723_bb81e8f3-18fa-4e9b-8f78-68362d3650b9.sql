
-- Table: avaliacoes
CREATE TABLE public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frete_id uuid NOT NULL REFERENCES public.fretes(id) ON DELETE CASCADE,
  avaliador_id uuid NOT NULL,
  avaliado_id uuid NOT NULL,
  nota integer NOT NULL,
  comentario text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (frete_id, avaliador_id)
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_avaliacao_nota()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.nota < 1 OR NEW.nota > 5 THEN
    RAISE EXCEPTION 'nota must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_avaliacao_nota
  BEFORE INSERT OR UPDATE ON public.avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.validate_avaliacao_nota();

-- RLS
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view avaliacoes"
  ON public.avaliacoes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Participants can insert avaliacoes"
  ON public.avaliacoes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = avaliador_id
    AND can_access_frete_messages(auth.uid(), frete_id)
  );

-- RPC: get_user_rating
CREATE OR REPLACE FUNCTION public.get_user_rating(_user_id uuid)
RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'media', COALESCE(ROUND(AVG(nota)::numeric, 1), 0),
    'total', COUNT(*)::int
  )
  FROM public.avaliacoes
  WHERE avaliado_id = _user_id
$$;
