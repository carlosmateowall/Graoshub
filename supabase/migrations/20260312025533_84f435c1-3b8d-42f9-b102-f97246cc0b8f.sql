
-- Allow authenticated users to see basic profile info (nome) of other users
-- This is needed for chat, frete details, etc.
CREATE POLICY "Authenticated users can view all profiles nome"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Drop the restrictive "Users can view own profile" since the new policy covers it
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Allow motoristas to view cargas that are em_andamento for their fretes
CREATE POLICY "Motoristas can view cargas of own fretes"
ON public.cargas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fretes
    WHERE fretes.carga_id = cargas.id AND fretes.motorista_id = auth.uid()
  )
);
