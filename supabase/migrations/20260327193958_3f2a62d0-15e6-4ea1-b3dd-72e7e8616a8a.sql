
-- 1. Trigger: auto-update carga status when frete is inserted (aceito → em_andamento)
CREATE OR REPLACE FUNCTION public.sync_carga_status_on_frete_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.cargas SET status = 'em_andamento', updated_at = now()
  WHERE id = NEW.carga_id AND status = 'disponivel';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_frete_insert_sync_carga
AFTER INSERT ON public.fretes
FOR EACH ROW
EXECUTE FUNCTION public.sync_carga_status_on_frete_insert();

-- 2. Trigger: auto-update carga status when frete status changes
CREATE OR REPLACE FUNCTION public.sync_carga_status_on_frete_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'entregue' THEN
    UPDATE public.cargas SET status = 'concluida', updated_at = now() WHERE id = NEW.carga_id;
  ELSIF NEW.status = 'cancelado' THEN
    UPDATE public.cargas SET status = 'disponivel', updated_at = now() WHERE id = NEW.carga_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_frete_update_sync_carga
AFTER UPDATE OF status ON public.fretes
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.sync_carga_status_on_frete_update();

-- 3. Atomic RPC for accepting a frete (prevents race condition)
CREATE OR REPLACE FUNCTION public.accept_frete(_carga_id uuid, _motorista_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _frete_id uuid;
BEGIN
  -- Lock the carga row to prevent concurrent acceptance
  PERFORM 1 FROM public.cargas WHERE id = _carga_id AND status = 'disponivel' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Carga não está mais disponível';
  END IF;

  -- Check if motorista already accepted
  IF EXISTS (SELECT 1 FROM public.fretes WHERE carga_id = _carga_id AND motorista_id = _motorista_id) THEN
    RAISE EXCEPTION 'Você já aceitou este frete';
  END IF;

  -- Insert frete (trigger will update carga status)
  INSERT INTO public.fretes (carga_id, motorista_id)
  VALUES (_carga_id, _motorista_id)
  RETURNING id INTO _frete_id;

  RETURN _frete_id;
END;
$$;
