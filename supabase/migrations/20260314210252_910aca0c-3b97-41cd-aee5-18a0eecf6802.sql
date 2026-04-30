
-- Create notificacoes table
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  mensagem text NOT NULL DEFAULT '',
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notificacoes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notificacoes FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Trigger function: notify on frete insert (notify contratante)
CREATE OR REPLACE FUNCTION public.notify_frete_aceito()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _contratante_id uuid;
  _origem text;
  _destino text;
BEGIN
  SELECT c.contratante_id, c.origem, c.destino
  INTO _contratante_id, _origem, _destino
  FROM public.cargas c WHERE c.id = NEW.carga_id;

  IF _contratante_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem)
    VALUES (
      _contratante_id,
      '🚛 Frete aceito!',
      'Um motorista aceitou seu frete ' || _origem || ' → ' || _destino
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_frete_aceito
AFTER INSERT ON public.fretes
FOR EACH ROW EXECUTE FUNCTION public.notify_frete_aceito();

-- Trigger function: notify on frete status change
CREATE OR REPLACE FUNCTION public.notify_frete_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _contratante_id uuid;
  _motorista_id uuid;
  _origem text;
  _status_label text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT c.contratante_id, c.origem INTO _contratante_id, _origem
  FROM public.cargas c WHERE c.id = NEW.carga_id;
  _motorista_id := NEW.motorista_id;

  _status_label := CASE NEW.status
    WHEN 'em_coleta' THEN '📦 Em coleta'
    WHEN 'em_transito' THEN '🚚 Em trânsito'
    WHEN 'entregue' THEN '✅ Entregue'
    WHEN 'cancelado' THEN '❌ Cancelado'
    ELSE NEW.status::text
  END;

  -- Notify contratante
  IF _contratante_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem)
    VALUES (_contratante_id, _status_label, 'Frete de ' || _origem || ' atualizado');
  END IF;

  -- Notify motorista
  IF _motorista_id IS NOT NULL AND _motorista_id != _contratante_id THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem)
    VALUES (_motorista_id, _status_label, 'Frete de ' || _origem || ' atualizado');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_frete_status
AFTER UPDATE ON public.fretes
FOR EACH ROW EXECUTE FUNCTION public.notify_frete_status_change();
