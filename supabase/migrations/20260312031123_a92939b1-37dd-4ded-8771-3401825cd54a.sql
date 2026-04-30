
-- Fix mensagens policies that also cross-reference fretes and cargas
-- These could also cause recursion issues

-- Helper function for mensagens access
CREATE OR REPLACE FUNCTION public.can_access_frete_messages(_user_id uuid, _frete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fretes f
    JOIN public.cargas c ON c.id = f.carga_id
    WHERE f.id = _frete_id 
    AND (f.motorista_id = _user_id OR c.contratante_id = _user_id)
  )
$$;

-- Drop old mensagens policies
DROP POLICY IF EXISTS "Contratantes can insert messages on own fretes" ON public.mensagens;
DROP POLICY IF EXISTS "Contratantes can view messages of own fretes" ON public.mensagens;
DROP POLICY IF EXISTS "Motoristas can insert messages on own fretes" ON public.mensagens;
DROP POLICY IF EXISTS "Motoristas can view messages of own fretes" ON public.mensagens;

-- Recreate with security definer function
CREATE POLICY "Users can view messages of own fretes"
ON public.mensagens FOR SELECT
TO authenticated
USING (public.can_access_frete_messages(auth.uid(), frete_id));

CREATE POLICY "Users can insert messages on own fretes"
ON public.mensagens FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id AND public.can_access_frete_messages(auth.uid(), frete_id));
