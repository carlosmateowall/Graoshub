
-- Fix search_path on validate_avaliacao_nota
CREATE OR REPLACE FUNCTION public.validate_avaliacao_nota()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.nota < 1 OR NEW.nota > 5 THEN
    RAISE EXCEPTION 'nota must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;
