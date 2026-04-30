import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { useAppLayout } from "@/hooks/useAppLayout";
import { Star, Phone, Warehouse } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Armazem = Tables<"armazens">;

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const warehouseIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const userIcon = new L.DivIcon({
  html: `<div style="width:20px;height:20px;background:hsl(38 92% 50%);border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(245,158,11,0.3),0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10], className: "",
});

function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();
  useEffect(() => {
    map.locate({ setView: false, maxZoom: 12 });
    map.on("locationfound", (e) => { setPosition(e.latlng); map.flyTo(e.latlng, 10, { duration: 1.5 }); });
  }, [map]);
  return position ? (
    <Marker position={position} icon={userIcon}>
      <Popup><div className="text-center"><strong className="text-sm">📍 Sua localização</strong></div></Popup>
    </Marker>
  ) : null;
}

const MapaArmazens = () => {
  const { toast } = useAppLayout();
  const [armazens, setArmazens] = useState<Armazem[]>([]);
  const [selectedArmazem, setSelectedArmazem] = useState<Armazem | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("armazens").select("*").order("avaliacao", { ascending: false });
      setArmazens(data || []);
    };
    load();
  }, []);

  const defaultCenter: [number, number] = [-15.78, -47.93];

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-[1000] px-5 pt-3 pb-6 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, hsl(153 39% 16% / 0.9), transparent)" }}>
        <h1 className="text-xl font-extrabold text-primary-foreground mb-1">Galpões e Armazéns</h1>
        <p className="text-xs text-primary-foreground/65">{armazens.length} pontos na sua região</p>
      </div>
      <div className="flex-1 relative">
        <MapContainer center={defaultCenter} zoom={9} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker />
          {armazens.map((a) => (
            <Marker key={a.id} position={[a.lat, a.lng]} icon={warehouseIcon}
              eventHandlers={{ click: () => { setSelectedArmazem(a); if (cardsRef.current) { const idx = armazens.findIndex((x) => x.id === a.id); cardsRef.current.scrollTo({ left: idx * 212, behavior: "smooth" }); } } }}>
              <Popup><div><strong className="text-sm">{a.nome}</strong><br /><span className="text-xs text-muted-foreground">{a.cidade}</span><br /><span className="text-xs">⭐ {a.avaliacao} · {a.capacidade}</span></div></Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-[1000] px-3 pt-3" style={{ background: "linear-gradient(to top, hsl(var(--background)) 70%, transparent)" }}>
        <div ref={cardsRef} className="flex gap-2.5 overflow-x-auto phone-scroll pb-28">
          {armazens.map((c) => (
            <a key={c.id} href={c.telefone ? `tel:${c.telefone.replace(/\D/g, "")}` : "#"}
              onClick={(e) => { if (!c.telefone) { e.preventDefault(); toast("Telefone não disponível"); } }}
              className={`flex-shrink-0 w-[200px] bg-card rounded-2xl p-3.5 cursor-pointer text-left active:scale-[0.97] transition-all shadow-card-soft no-underline ${selectedArmazem?.id === c.id ? "ring-2 ring-primary" : ""}`}>
              <div className="flex items-center gap-1.5 mb-2"><Warehouse size={12} className="text-primary" /><span className="text-[10px] font-bold text-primary uppercase tracking-wider">{c.capacidade}</span></div>
              <span className="text-sm font-extrabold text-foreground leading-tight block mb-0.5">{c.nome}</span>
              <span className="text-xs text-muted-foreground block mb-2">📍 {c.cidade}</span>
              <div className="flex items-center gap-1 text-xs text-accent font-bold mb-1"><Star size={11} fill="currentColor" /> {c.avaliacao}</div>
              <div className="flex items-center gap-1 text-[11px] text-info font-medium"><Phone size={10} /> {c.telefone}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapaArmazens;
