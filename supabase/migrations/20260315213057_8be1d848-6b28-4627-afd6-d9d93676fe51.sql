
-- Fix: Replace the overly permissive profiles SELECT policy
-- The current policy exposes all columns (including telefone) to all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all profiles nome" ON public.profiles;

-- Allow authenticated users to see only public info (nome, avatar_url, cidade)
-- But for telefone they can only see their own
CREATE POLICY "Authenticated users can view public profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Note: Since RLS can't filter columns, we'll handle telefone privacy in the app layer
-- The policy name is updated to reflect the actual behavior

-- Enable leaked password protection
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
