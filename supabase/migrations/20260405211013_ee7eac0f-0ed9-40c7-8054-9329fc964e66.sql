
-- Add KYC columns to profiles
ALTER TABLE public.profiles
ADD COLUMN kyc_status text NOT NULL DEFAULT 'nao_verificado',
ADD COLUMN cnh_url text,
ADD COLUMN crlv_url text;

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_kyc_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.kyc_status NOT IN ('nao_verificado', 'pendente', 'aprovado', 'rejeitado') THEN
    RAISE EXCEPTION 'Invalid kyc_status value: %', NEW.kyc_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_kyc_status
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_kyc_status();

-- Create private storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos_kyc', 'documentos_kyc', false);

-- Storage policies: users can manage their own docs
CREATE POLICY "Users can upload own KYC docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos_kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own KYC docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos_kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own KYC docs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documentos_kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all KYC docs
CREATE POLICY "Admins can view all KYC docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos_kyc' AND has_role(auth.uid(), 'admin'::app_role));
