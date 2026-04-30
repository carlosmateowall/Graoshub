
CREATE TABLE public.bloqueios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  blocked_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);

ALTER TABLE public.bloqueios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks" ON public.bloqueios FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own blocks" ON public.bloqueios FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own blocks" ON public.bloqueios FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all blocks" ON public.bloqueios FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
