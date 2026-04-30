-- Allow admins to insert notifications (for broadcast feature)
CREATE POLICY "Admins can insert notifications"
ON public.notificacoes
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete notifications
CREATE POLICY "Admins can manage all notifications"
ON public.notificacoes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));