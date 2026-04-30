import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { friendlyError } from "@/lib/friendlyError";

interface Denuncia {
  id: string;
  reporter_id: string;
  tipo: "anuncio" | "usuario";
  target_id: string;
  motivo: string;
  descricao: string | null;
  status: string;
  created_at: string;
}

interface Props { toast: (msg: string) => void; }

const statusConfig: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  pendente: { label: "Pendente", icon: <Clock size={14} />, cls: "text-accent bg-accent/10" },
  resolvida: { label: "Resolvida", icon: <CheckCircle size={14} />, cls: "text-success bg-success/10" },
  rejeitada: { label: "Rejeitada", icon: <XCircle size={14} />, cls: "text-destructive bg-destructive/10" },
};

const AdminDenuncias = ({ toast }: Props) => {
  const [items, setItems] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pendente" | "resolvida" | "rejeitada">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("denuncias")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setItems(data as Denuncia[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    const { error } = await supabase
      .from("denuncias")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) {
      toast(friendlyError(error.message));
    } else {
      toast(`Denúncia marcada como "${newStatus}"`);
      setItems(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    }
    setUpdating(null);
  };

  const filtered = filter === "all" ? items : items.filter(d => d.status === filter);
  const pendingCount = items.filter(d => d.status === "pendente").length;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

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
          { key: "all", label: `Todas (${items.length})` },
          { key: "pendente", label: `Pendentes (${pendingCount})` },
          { key: "resolvida", label: "Resolvidas" },
          { key: "rejeitada", label: "Rejeitadas" },
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
        {filtered.map(d => {
          const sc = statusConfig[d.status] ?? statusConfig.pendente;
          const expanded = expandedId === d.id;

          return (
            <div key={d.id} className="bg-card rounded-2xl shadow-card-soft overflow-hidden">
              <button
                onClick={() => setExpandedId(expanded ? null : d.id)}
                className="w-full flex items-center gap-3 p-3.5 bg-transparent border-none cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-destructive/8 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${d.tipo === "usuario" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent-foreground"}`}>
                      {d.tipo}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.cls}`}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{d.motivo}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(d.created_at)}</p>
                </div>
                {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </button>

              {expanded && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-border">
                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Descrição</p>
                      <p className="font-medium text-foreground">{d.descricao || "Sem descrição adicional"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-muted-foreground">Reporter ID</p>
                        <p className="font-mono text-[10px] text-foreground truncate">{d.reporter_id.slice(0, 12)}...</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target ID</p>
                        <p className="font-mono text-[10px] text-foreground truncate">{d.target_id.slice(0, 12)}...</p>
                      </div>
                    </div>

                    {d.status === "pendente" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => updateStatus(d.id, "resolvida")}
                          disabled={updating === d.id}
                          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs border-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <CheckCircle size={14} /> Resolver
                        </button>
                        <button
                          onClick={() => updateStatus(d.id, "rejeitada")}
                          disabled={updating === d.id}
                          className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-bold text-xs border-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <XCircle size={14} /> Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <CheckCircle size={32} className="mx-auto text-success/40 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma denúncia {filter !== "all" ? filter : ""}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDenuncias;
