import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import type { TrackingLocation } from "@/hooks/useMotoristaTracking";

// Inline truck icon — avoids leaflet default icon asset issues
const truckIcon = L.divIcon({
  html: `<div style="background:#16a34a;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35)">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  </div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
});

const RecenterMap = ({ location }: { location: TrackingLocation }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo([location.lat, location.lng], { animate: true, duration: 0.8 });
  }, [location, map]);
  return null;
};

interface TrackingMapProps {
  freteId: string;
  origem: string;
  destino: string;
}

const OFFLINE_TIMEOUT_MS = 30_000;

export default function TrackingMap({ freteId, origem, destino }: TrackingMapProps) {
  const [location, setLocation] = useState<TrackingLocation | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`tracking-${freteId}`)
      .on("broadcast", { event: "location" }, ({ payload }) => {
        setLocation(payload as TrackingLocation);
        setIsOnline(true);
        if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = setTimeout(() => setIsOnline(false), OFFLINE_TIMEOUT_MS);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
  }, [freteId]);

  if (!location) {
    return (
      <div className="w-full h-56 rounded-2xl bg-muted flex flex-col items-center justify-center gap-2 border border-border">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="animate-pulse text-primary" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-foreground">Aguardando localização...</p>
        <p className="text-xs text-muted-foreground">O motorista ainda não iniciou o rastreamento</p>
        <p className="text-xs text-muted-foreground/60 mt-1">{origem} → {destino}</p>
      </div>
    );
  }

  const lastSeen = new Date(location.timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-border shadow-card-soft">
      <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
          <span className="text-xs font-semibold text-foreground">{isOnline ? "Ao vivo" : "Última posição"}</span>
        </div>
        <span className="text-xs text-muted-foreground">Atualizado às {lastSeen}</span>
      </div>
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={14}
        style={{ height: "220px", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={[location.lat, location.lng]} icon={truckIcon}>
          <Popup>
            <span className="font-semibold text-sm">{origem} → {destino}</span>
          </Popup>
        </Marker>
        <RecenterMap location={location} />
      </MapContainer>
    </div>
  );
}
