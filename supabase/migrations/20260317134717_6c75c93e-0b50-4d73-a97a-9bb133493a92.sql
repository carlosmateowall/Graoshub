
-- Allow contratantes to update fretes status (for confirming receipt)
CREATE POLICY "Contratantes can update fretes of own cargas"
ON public.fretes
FOR UPDATE
TO authenticated
USING (is_contratante_of_frete(auth.uid(), carga_id))
WITH CHECK (is_contratante_of_frete(auth.uid(), carga_id));
