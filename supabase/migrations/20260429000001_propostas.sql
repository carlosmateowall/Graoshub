-- Tabela de propostas de negociação
CREATE TABLE propostas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carga_id    UUID NOT NULL REFERENCES cargas(id) ON DELETE CASCADE,
  motorista_id UUID NOT NULL,
  valor_proposta NUMERIC(12,2) NOT NULL CHECK (valor_proposta > 0),
  mensagem    TEXT,
  status      TEXT NOT NULL DEFAULT 'pendente'
              CHECK (status IN ('pendente', 'aceita', 'recusada', 'cancelada')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Um motorista só pode ter uma proposta pendente por carga
CREATE UNIQUE INDEX propostas_carga_motorista_pending
  ON propostas(carga_id, motorista_id)
  WHERE status = 'pendente';

ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;

-- Motorista: ver e criar suas propostas
CREATE POLICY "motorista_select_own_propostas" ON propostas
  FOR SELECT USING (auth.uid() = motorista_id);

CREATE POLICY "motorista_insert_proposta" ON propostas
  FOR INSERT WITH CHECK (auth.uid() = motorista_id);

CREATE POLICY "motorista_cancel_proposta" ON propostas
  FOR UPDATE USING (auth.uid() = motorista_id AND status = 'pendente')
  WITH CHECK (status = 'cancelada');

-- Contratante: ver propostas das suas cargas
CREATE POLICY "contratante_select_propostas" ON propostas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cargas
      WHERE cargas.id = propostas.carga_id
        AND cargas.contratante_id = auth.uid()
    )
  );

-- Contratante: aceitar ou recusar
CREATE POLICY "contratante_respond_proposta" ON propostas
  FOR UPDATE USING (
    status = 'pendente' AND EXISTS (
      SELECT 1 FROM cargas
      WHERE cargas.id = propostas.carga_id
        AND cargas.contratante_id = auth.uid()
    )
  )
  WITH CHECK (status IN ('aceita', 'recusada'));

-- RPC: contratante aceita uma proposta
-- Atualiza o valor da carga, cria o frete e cancela outras propostas pendentes
CREATE OR REPLACE FUNCTION accept_proposta(_proposta_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _p     propostas%ROWTYPE;
  _frete_id UUID;
BEGIN
  -- Busca e valida a proposta
  SELECT * INTO _p FROM propostas WHERE id = _proposta_id AND status = 'pendente';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposta não encontrada ou já processada';
  END IF;

  -- Valida que o chamador é o dono da carga
  IF NOT EXISTS (
    SELECT 1 FROM cargas
    WHERE id = _p.carga_id AND contratante_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Atualiza o valor negociado na carga
  UPDATE cargas SET valor = _p.valor_proposta WHERE id = _p.carga_id;

  -- Marca proposta como aceita
  UPDATE propostas SET status = 'aceita', updated_at = NOW() WHERE id = _proposta_id;

  -- Cancela demais propostas pendentes para a mesma carga
  UPDATE propostas
  SET status = 'cancelada', updated_at = NOW()
  WHERE carga_id = _p.carga_id AND id != _proposta_id AND status = 'pendente';

  -- Cria o frete com o motorista que propôs
  INSERT INTO fretes (carga_id, motorista_id, status, aceito_em)
  VALUES (_p.carga_id, _p.motorista_id, 'aceito', NOW())
  RETURNING id INTO _frete_id;

  -- Atualiza status da carga
  UPDATE cargas SET status = 'em_andamento' WHERE id = _p.carga_id;

  RETURN _frete_id;
END;
$$;
