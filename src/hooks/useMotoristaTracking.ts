import { useCallback, useEffect, useRef, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface TrackingLocation {
  lat: number;
  lng: number;
  timestamp: number;
}

export function useMotoristaTracking(freteId: string | undefined) {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const startTracking = useCallback(() => {
    if (!freteId) return;
    if (!navigator.geolocation) {
      setError("Geolocalização não disponível neste dispositivo.");
      return;
    }

    const channel = supabase.channel(`tracking-${freteId}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          channel.send({
            type: "broadcast",
            event: "location",
            payload: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              timestamp: pos.timestamp,
            } satisfies TrackingLocation,
          });
          setIsTracking(true);
          setError(null);
        },
        (err) => {
          setError(
            err.code === 1
              ? "Permissão de localização negada. Habilite nas configurações do navegador."
              : "Erro ao obter localização. Tente novamente."
          );
          setIsTracking(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    });
  }, [freteId]);

  useEffect(() => () => { stopTracking(); }, [stopTracking]);

  return { isTracking, error, startTracking, stopTracking };
}
