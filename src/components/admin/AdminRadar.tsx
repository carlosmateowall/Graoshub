import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Truck, MapPin } from "lucide-react";

// Fix default marker icons in bundled environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  toast: (msg: string) => void;
}

interface FreteAtivo {
  id: string;
  status: string;
  carga_id: string;
  motorista_id: string;
  origem: string;
  destino: string;
  tipo_grao: string;
  motorista_nome: string;
  motorista_telefone: string | null;
}

/** Generate deterministic mock coords inside Brazil from a UUID */
function mockCoords(id: string): [number, number] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const lat = -5 - Math.abs(hash % 25); // -5 to -30
  const lng = -35 - Math.abs((hash >> 8) % 18); // -35 to -53
  return [lat, lng];
}

const statusLabel: Record<string, string> = {
  em_coleta: "Em Coleta",
  em_transito: "Em Trânsito",
};

export default function AdminRadar({ toast }: Props) {
  const qc = useQueryClient();

  const { data: fretes, isLoading } = useQuery({
    queryKey: ["admin-radar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fretes")
        .select("id, status, carga_id, motorista_id, cargas(origem, destino, tipo_grao), profiles:motorista_id(nome, telefone)")
        .in("status", ["em_coleta", "em_transito"]);
      if (error) throw error;

      return (data ?? []).map((f: any) => ({
        id: f.id,
        status: f.status,
        carga_id: f.carga_id,
        motorista_id: f.motorista_id,
        origem: f.cargas?.origem ?? "—",
        destino: f.cargas?.destino ?? "—",
        tipo_grao: f.cargas?.tipo_grao ?? "—",
        motorista_nome: f.profiles?.nome ?? "Motorista",
        motorista_telefone: f.profiles?.telefone ?? null,
      })) as FreteAtivo[];
    },
    refetchInterval: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-radar-fretes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "fretes" },
        () => qc.invalidateQueries({ queryKey: ["admin-radar"] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const markers = useMemo(
    () => (fretes ?? []).map((f) => ({ ...f, coords: mockCoords(f.id) })),
    [fretes]
  );

  const openWhatsApp = (phone: string | null) => {
    if (!phone) {
      toast("Telefone do motorista não disponível.");
      return;
    }
    const cleaned = phone.replace(/\D/g, "");
    window.open(`https://wa.me/55${cleaned}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        <Skeleton className="rounded-lg" />
        <Skeleton className="lg:col-span-2 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
      {/* Left — Trip list */}
      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Viagens Ativas ({markers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-3 p-3 pt-0">
          {markers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum frete em trânsito no momento.
            </p>
          )}
          {markers.map((f) => (
            <div
              key={f.id}
              className="rounded-lg border bg-card p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm truncate">
                  {f.motorista_nome}
                </span>
                <Badge
                  variant="secondary"
                  className={
                    f.status === "em_transito"
                      ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }
                >
                  {statusLabel[f.status] ?? f.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                {f.origem} → {f.destino}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => openWhatsApp(f.motorista_telefone)}
              >
                <Phone className="h-3 w-3 mr-1" />
                Contactar Motorista
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Right — Map */}
      <Card className="lg:col-span-2 overflow-hidden flex flex-col">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-sm">Mapa — Brasil</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 relative">
          <MapContainer
            center={[-14.5, -46]}
            zoom={4}
            scrollWheelZoom
            className="h-full w-full"
            style={{ minHeight: 300 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map((f) => (
              <Marker key={f.id} position={f.coords}>
                <Popup>
                  <div className="text-sm space-y-1">
                    <strong>{f.motorista_nome}</strong>
                    <p>
                      {f.origem} → {f.destino}
                    </p>
                    <p className="text-xs text-gray-500">{f.tipo_grao}</p>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {statusLabel[f.status]}
                    </Badge>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </CardContent>
      </Card>
    </div>
  );
}
