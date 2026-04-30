
-- Function to get admin dashboard stats (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'total_fretes_mes', (SELECT count(*) FROM public.fretes WHERE created_at >= date_trunc('month', now())),
    'total_fretes', (SELECT count(*) FROM public.fretes),
    'volume_fretes', (SELECT coalesce(sum(c.valor), 0) FROM public.fretes f JOIN public.cargas c ON c.id = f.carga_id),
    'total_cargas', (SELECT count(*) FROM public.cargas),
    'total_anuncios', (SELECT count(*) FROM public.anuncios),
    'total_armazens', (SELECT count(*) FROM public.armazens)
  )
$$;

-- Function to get user profile stats
CREATE OR REPLACE FUNCTION public.get_user_stats(_user_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_fretes', (
      SELECT count(*) FROM public.fretes f
      JOIN public.cargas c ON c.id = f.carga_id
      WHERE f.motorista_id = _user_id OR c.contratante_id = _user_id
    ),
    'valor_movimentado', (
      SELECT coalesce(sum(c.valor), 0) FROM public.fretes f
      JOIN public.cargas c ON c.id = f.carga_id
      WHERE (f.motorista_id = _user_id OR c.contratante_id = _user_id)
      AND f.status = 'entregue'
    ),
    'total_anuncios', (
      SELECT count(*) FROM public.anuncios WHERE user_id = _user_id
    )
  )
$$;
