
-- Fix infinite recursion between cargas and fretes RLS policies

-- Step 1: Create security definer helper functions to break the cycle
CREATE OR REPLACE FUNCTION public.is_motorista_of_carga(_user_id uuid, _carga_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fretes
    WHERE fretes.carga_id = _carga_id AND fretes.motorista_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_contratante_of_frete(_user_id uuid, _frete_carga_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cargas
    WHERE cargas.id = _frete_carga_id AND cargas.contratante_id = _user_id
  )
$$;

-- Step 2: Drop the recursive policies
DROP POLICY IF EXISTS "Motoristas can view cargas of own fretes" ON public.cargas;
DROP POLICY IF EXISTS "Contratantes can view fretes of own cargas" ON public.fretes;

-- Step 3: Recreate policies using security definer functions (no cross-table references)
CREATE POLICY "Motoristas can view cargas of own fretes"
ON public.cargas FOR SELECT
TO authenticated
USING (public.is_motorista_of_carga(auth.uid(), id));

CREATE POLICY "Contratantes can view fretes of own cargas"
ON public.fretes FOR SELECT
TO authenticated
USING (public.is_contratante_of_frete(auth.uid(), carga_id));
