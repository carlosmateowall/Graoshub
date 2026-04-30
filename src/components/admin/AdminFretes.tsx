import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck, MapPin, Package, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

interface FreteRow {
  id: string;
  status: string;
  created_at: string;
  aceito_em: string | null;
  coletado_em: string | null;
  entregue_em: string | null;
  motorista_id: string;
  carga_id: string;
  cargas: {
    origem: string;
    destino: string;
    tipo_grao: string;
    quantidade: number;
    valor: number;
    contratante_id: string;
  };
}

interface Props { toast: (msg: string) => void; }

const statusMap: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  aceito: { label: "Aceito", cls: "bg-primary/10 text-primary", icon: <Clock size={12} /> },
  em_coleta: { label: "Em Coleta", cls: "bg-accent/10 text-accent-foreground", icon: <Package size={12} /> },
  em_transito: { label: "Em Trânsito", cls: "bg-info/10 text-info", icon: <Truck size={12} /> },
  entregue: { label: "Entregue", cls: "bg-success/10 text-success", icon: <CheckCircle size={12} /> },
  cancelado: { label: "Cancelado", cls: "bg-destructive/10 text-destructive", icon: <XCircle size={12} /> },
};

const AdminFretes = ({ toast }: Props) => {
  const [fretes, setFretes] = useState<FreteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ativos" | "entregue" | "cancelado" | "todos">("ativos");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("fretes")
        .select("id, status, created_at, aceito_em, coletado_em, entregue_em, motorista_id, carga_id, cargas(origem, destino, tipo_grao, quantidade, valor, contratante_id)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setFretes(data as unknown as FreteRow[]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = fretes.filter(f => {
    if (filter === "ativos") return ["aceito", "em_coleta", "em_transito"].includes(f.status);
    if (filter === "todos") return true;
    return f.status === filter;
  });

  const activoCount = fretes.filter(f => ["aceito", "em_coleta", "em_transito"].includes(f.status)).length;

  const fmt = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR");
  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {([
          { key: "ativos", label: `Ativos (${activoCount})` },
          { key: "entregue", label: "Entregues" },
          { key: "cancelado", label: "Cancelados" },
          { key: "todos", label: `Todos (${fretes.length})` },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border-none cursor-pointer whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(f => {
          const sm = statusMap[f.status] ?? statusMap.aceito;
          const c = f.cargas;
          const expanded = expandedId === f.id;

          return (
            <div key={f.id} className="bg-card rounded-2xl shadow-card-soft overflow-hidden">
              <button
                onClick={() => setExpandedId(expanded ? null : f.id)}
                className="w-full flex items-center gap-3 p-3.5 bg-transparent border-none cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Truck size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sm.cls}`}>
                      {sm.icon} {sm.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{c?.tipo_grao}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {c?.origem} → {c?.destino}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(f.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold text-primary">{c ? fmt(c.valor) : "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{c ? `${c.quantidade}t` : ""}</p>
                </div>
                {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </button>

              {expanded && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-border">
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Origem</p>
                      <p className="font-semibold text-foreground flex items-center gap-1"><MapPin size={12} className="text-success" /> {c?.origem}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Destino</p>
                      <p className="font-semibold text-foreground flex items-center gap-1"><MapPin size={12} className="text-destructive" /> {c?.destino}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Aceito em</p>
                      <p className="font-semibold text-foreground">{f.aceito_em ? formatDate(f.aceito_em) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Entregue em</p>
                      <p className="font-semibold text-foreground">{f.entregue_em ? formatDate(f.entregue_em) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Motorista</p>
                      <p className="font-mono text-[10px] text-foreground truncate">{f.motorista_id.slice(0, 12)}...</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contratante</p>
                      <p className="font-mono text-[10px] text-foreground truncate">{c?.contratante_id?.slice(0, 12)}...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <Truck size={32} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum frete encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFretes;
