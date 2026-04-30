
-- Add admin role to the main user account (Mateo Wall)
-- Users can have multiple roles, so this doesn't remove the contratante role
INSERT INTO public.user_roles (user_id, role)
VALUES ('340721c9-b3f1-4adc-b07f-ae8882ae8402', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
