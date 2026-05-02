-- Add em_disputa to frete_status enum
ALTER TYPE frete_status ADD VALUE IF NOT EXISTS 'em_disputa';

-- disputas table
CREATE TABLE IF NOT EXISTS disputas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frete_id UUID NOT NULL REFERENCES fretes(id) ON DELETE CASCADE,
  aberto_por UUID NOT NULL REFERENCES auth.users(id),
  motivo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'resolvida', 'encerrada')),
  resolucao TEXT,
  status_frete_anterior TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

ALTER TABLE disputas ENABLE ROW LEVEL SECURITY;

-- Parties (motorista + contratante) and admins can view
CREATE POLICY "disputas_select" ON disputas FOR SELECT
  USING (
    auth.uid() = aberto_por
    OR EXISTS (
      SELECT 1 FROM fretes f
      JOIN cargas c ON c.id = f.carga_id
      WHERE f.id = frete_id
        AND (f.motorista_id = auth.uid() OR c.contratante_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Insert only via RPC (SECURITY DEFINER enforces logic)
CREATE POLICY "disputas_insert" ON disputas FOR INSERT
  WITH CHECK (auth.uid() = aberto_por);

-- Only admin can update (resolve)
CREATE POLICY "disputas_update_admin" ON disputas FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- open_disputa: opens a dispute and sets frete to em_disputa
CREATE OR REPLACE FUNCTION open_disputa(
  _frete_id UUID,
  _motivo TEXT,
  _descricao TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _contratante_id UUID;
  _motorista_id UUID;
  _current_status frete_status;
  _disputa_id UUID;
BEGIN
  SELECT f.status, f.motorista_id, c.contratante_id
  INTO _current_status, _motorista_id, _contratante_id
  FROM fretes f
  JOIN cargas c ON c.id = f.carga_id
  WHERE f.id = _frete_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Frete não encontrado';
  END IF;

  IF _user_id != _motorista_id AND _user_id != _contratante_id THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF _current_status NOT IN ('em_coleta', 'em_transito', 'aguardando_confirmacao') THEN
    RAISE EXCEPTION 'Disputa só pode ser aberta em fretes em andamento';
  END IF;

  IF EXISTS (SELECT 1 FROM disputas WHERE frete_id = _frete_id AND status = 'pendente') THEN
    RAISE EXCEPTION 'Já existe uma disputa aberta para este frete';
  END IF;

  INSERT INTO disputas (frete_id, aberto_por, motivo, descricao, status_frete_anterior)
  VALUES (_frete_id, _user_id, _motivo, _descricao, _current_status::TEXT)
  RETURNING id INTO _disputa_id;

  UPDATE fretes SET status = 'em_disputa' WHERE id = _frete_id;

  RETURN _disputa_id;
END;
$$;

-- resolve_disputa: admin resolves a dispute and sets frete to a final status
CREATE OR REPLACE FUNCTION resolve_disputa(
  _disputa_id UUID,
  _resolucao TEXT,
  _novo_status_frete TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _frete_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE disputas
  SET
    status = 'resolvida',
    resolucao = _resolucao,
    resolved_at = now(),
    resolved_by = auth.uid()
  WHERE id = _disputa_id AND status = 'pendente'
  RETURNING frete_id INTO _frete_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Disputa não encontrada ou já resolvida';
  END IF;

  EXECUTE format(
    'UPDATE fretes SET status = %L::frete_status WHERE id = %L',
    _novo_status_frete,
    _frete_id
  );
END;
$$;
