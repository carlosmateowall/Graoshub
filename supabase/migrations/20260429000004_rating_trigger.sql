-- Add url column to notificacoes for deep-linking
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS url TEXT;

-- Trigger function: fires when a frete is marked as entregue
-- Creates in-app notifications for both motorista and contratante prompting them to rate
CREATE OR REPLACE FUNCTION notify_frete_entregue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _contratante_id UUID;
  _motorista_id UUID;
  _tipo_grao TEXT;
  _motorista_nome TEXT;
  _contratante_nome TEXT;
  _frete_url TEXT;
BEGIN
  -- Only fire when status changes TO 'entregue'
  IF NEW.status = 'entregue' AND (OLD.status IS DISTINCT FROM 'entregue') THEN
    _motorista_id := NEW.motorista_id;
    _frete_url := '/fretes/' || NEW.id || '/status';

    -- Get carga info
    SELECT c.contratante_id, c.tipo_grao
    INTO _contratante_id, _tipo_grao
    FROM cargas c
    WHERE c.id = NEW.carga_id;

    -- Get profile names for personalized messages
    SELECT nome INTO _motorista_nome FROM profiles WHERE id = _motorista_id;
    SELECT nome INTO _contratante_nome FROM profiles WHERE id = _contratante_id;

    -- Notify motorista to rate contratante
    INSERT INTO notificacoes (user_id, titulo, mensagem, lida, url)
    VALUES (
      _motorista_id,
      'Como foi o contratante?',
      'Frete de ' || COALESCE(_tipo_grao, 'carga') || ' concluído! Avalie ' || COALESCE(_contratante_nome, 'o contratante') || ' e ajude a comunidade GrãoHub.',
      false,
      _frete_url
    );

    -- Notify contratante to rate motorista
    INSERT INTO notificacoes (user_id, titulo, mensagem, lida, url)
    VALUES (
      _contratante_id,
      'Como foi o motorista?',
      'Sua carga chegou! Avalie ' || COALESCE(_motorista_nome, 'o motorista') || ' e ajude outros produtores a escolher bem.',
      false,
      _frete_url
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to fretes table
DROP TRIGGER IF EXISTS trg_notify_frete_entregue ON fretes;
CREATE TRIGGER trg_notify_frete_entregue
  AFTER UPDATE ON fretes
  FOR EACH ROW
  EXECUTE FUNCTION notify_frete_entregue();
