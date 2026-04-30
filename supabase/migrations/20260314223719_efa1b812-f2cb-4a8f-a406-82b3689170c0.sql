-- Liberar acesso de admin para gistavopalmieri70@gmail.com
-- Primeiro buscamos o user_id pelo email, depois inserimos a role admin

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'gistavopalmieri70@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;