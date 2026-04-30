import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { registerServiceWorker, subscribeToPush } from "@/lib/pushSubscription";

const isSupported = typeof window !== "undefined" && "Notification" in window;

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : "denied"
  );

  // Registra o SW na montagem — necessário mesmo antes de pedir permissão
  useEffect(() => { registerServiceWorker(); }, []);

  // Se já tem permissão, garante que a subscription existe
  useEffect(() => {
    if (user && permission === "granted") subscribeToPush(user.id);
  }, [user, permission]);

  const requestPermission = useCallback(async () => {
    if (!isSupported || !user) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") await subscribeToPush(user.id);
  }, [user]);

  // Fallback in-app: dispara Notification API se o app estiver em background
  // e o push do SW ainda não chegou (latência de rede)
  useEffect(() => {
    if (!user || !isSupported || permission !== "granted") return;
    const channel = supabase
      .channel(`push-fallback-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificacoes", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (document.visibilityState === "visible") return;
          const n = payload.new as { titulo: string; mensagem: string; id: string };
          try {
            new Notification(n.titulo, {
              body: n.mensagem,
              icon: "/icons/icon-192.png",
              badge: "/icons/icon-192.png",
              tag: `fallback-${n.id}`,
            });
          } catch { /* ignore */ }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, permission]);

  return { permission, requestPermission, isSupported };
}
