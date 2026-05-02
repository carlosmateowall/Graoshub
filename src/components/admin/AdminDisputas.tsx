import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gavel, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { friendlyError } from "@/lib/friendlyError";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Disputa {
  id: string;
  frete_id: string;
  aberto_por: string;
  motivo: string;
  descricao: string | null;
  status: string;
  resolucao: string | null;
  status_frete_anterior: string | null;
  created_at: string;
  resolved_at: string | null;
  frete_info?: { tipo_grao: string; origem: string; destino: string };
  aberto_por_nome?: string;
}

interface Props { toast: (msg: string) => void; }

const statusConfig: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  pendente: { label: "Pendente", icon: <Clock size={14} />, cls: "text-accent bg-accent/10" },
  resolvida: { label: "Resolvida", icon: <CheckCircle size={14} />, cls: "text-success bg-success/10" },
  encerrada: { label: "Encerrada", icon: <XCircle size={14} />, cls: "text-muted-foreground bg-muted" },
};

const AdminDisputas = ({ toast }: Props) => {
  const [items, setItems] = useState<Disputa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pendente" | "resolvida" | "encerrada">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolveDialog, setResolveDialog] = useState<Disputa | null>(null);
  const [resolucao, setResolucao] = useState("");
  const [novoStatus, setNovoStatus] = useState("entregue");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("disputas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!data) { setLoading(false); return; }

    const freteIds = [...new Set(data.map((d: Disputa) => d.frete_id))];
    const abrirIds = [...new Set(data.map((d: Disputa) => d.aberto_por))];

    const [freteRes, profRes] = await Promise.all([
      supabase.from("fretes").select("id, carga_id").in("id", freteIds),
      supabase.from("profiles").select("id, nome").in("id", abrirIds),
    ]);

    const cargaIds = [...new Set((freteRes.data || []).map((f: { carga_id: string }) => f.carga_id))];
    const { data: cargasData } = await supabase
      .from("cargas")
      .select("id, tipo_grao, origem, destino")
      .in("id", cargaIds);

    const freteMap = new Map((freteRes.data || []).map((f: { id: string; carga_id: string }) => [f.id, f.carga_id]));
    const cargaMap = new Map((cargasData || []).map((c: { id: string; tipo_grao: string; origem: string; destino: string }) => [c.id, c]));
    const profMap = new Map((profRes.data || []).map((p: { id: string; nome: string }) => [p.id, p.nome]));

    const enriched = (data as Disputa[]).map((d) => {
      const cargaId = freteMap.get(d.frete_id);
      const carga = cargaId ? cargaMap.get(cargaId) : null;
      return {
        ...d,
        frete_info: carga ? { tipo_grao: carga.tipo_grao, origem: carga.origem, destino: carga.destino } : undefined,
        aberto_por_nome: profMap.get(d.aberto_por) || "Usuário",
      };
    });

    setItems(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleResolve = async () => {
    if (!resolveDialog || !resolucao.trim()) return;
    setSubmitting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("resolve_disputa", {
      _disputa_id: resolveDialog.id,
      _resolucao: resolucao.trim(),
      _novo_status_frete: novoStatus,
    });
    if (error) {
      toast(friendlyError(error.message));
    } else {
      toast("Disputa resolvida. Frete atualizado.");
      setItems(prev => prev.map(d => d.id === resolveDialog.id ? { ...d, status: "resolvida", resolucao: resolucao.trim() } : d));
      setResolveDialog(null);
      setResolucao("");
      setNovoStatus("entregue");
    }
    setSubmitting(false);
  };

  const handleEncerrar = async (id: string) => {
    setResolving(id);
    const { error } = await supabase.from("disputas").update({ status: "encerrada" }).eq("id", id);
    if (error) {
      toast(friendlyError(error.message));
    } else {
      toast("Disputa encerrada.");
      setItems(prev => prev.map(d => d.id === id ? { ...d, status: "encerrada" } : d));
    }
    setResolving(null);
  };

  const filtered = filter === "all" ? items : items.filter(d => d.status === filter);
  const pendingCount = items.filter(d => d.status === "pendente").length;
  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {([
          { key: "all", label: `Todas (${items.length})` },
          { key: "pendente", label: `Pendentes (${pendingCount})` },
          { key: "resolvida", label: "Resolvidas" },
          { key: "encerrada", label: "Encerradas" },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border-none cursor-pointer whitespace-nowrap transition-colors ${
              filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

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
                  <Gavel size={18} className="text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.cls}`}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {d.frete_info ? `${d.frete_info.tipo_grao} · ${d.frete_info.origem} → ${d.frete_info.destino}` : d.frete_id.slice(0, 12) + "..."}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{d.motivo} · {formatDate(d.created_at)}</p>
                </div>
                {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </button>

              {expanded && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-border">
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-muted-foreground">Aberto por</p>
                        <p className="font-semibold text-foreground">{d.aberto_por_nome}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status anterior</p>
                        <p className="font-semibold text-foreground">{d.status_frete_anterior || "—"}</p>
                      </div>
                    </div>
                    {d.descricao && (
                      <div>
                        <p className="text-muted-foreground">Descrição</p>
                        <p className="font-medium text-foreground">{d.descricao}</p>
                      </div>
                    )}
                    {d.resolucao && (
                      <div>
                        <p className="text-muted-foreground">Resolução</p>
                        <p className="font-medium text-foreground">{d.resolucao}</p>
                      </div>
                    )}
                    {d.status === "pendente" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => { setResolveDialog(d); setNovoStatus("entregue"); }}
                          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs border-none cursor-pointer flex items-center justify-center gap-1"
                        >
                          <CheckCircle size={14} /> Resolver
                        </button>
                        <button
                          onClick={() => handleEncerrar(d.id)}
                          disabled={resolving === d.id}
                          className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-bold text-xs border-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <XCircle size={14} /> Encerrar
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
            <p className="text-sm text-muted-foreground">Nenhuma disputa {filter !== "all" ? filter : ""}</p>
          </div>
        )}
      </div>

      <Dialog open={!!resolveDialog} onOpenChange={(o) => !o && setResolveDialog(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Resolver Disputa</DialogTitle>
            <DialogDescription>Descreva a resolução e defina o novo status do frete.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Resolução</label>
              <textarea
                value={resolucao}
                onChange={e => setResolucao(e.target.value)}
                rows={3}
                placeholder="Descreva o que foi decidido..."
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Novo status do frete</label>
              <select
                value={novoStatus}
                onChange={e => setNovoStatus(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="entregue">Entregue (frete concluído)</option>
                <option value="cancelado">Cancelado (frete cancelado)</option>
                <option value="em_transito">Em transporte (retornar ao fluxo)</option>
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setResolveDialog(null)} className="flex-1 py-3 rounded-xl bg-muted text-foreground font-semibold text-sm border-none cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleResolve}
                disabled={submitting || !resolucao.trim()}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm border-none cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputas;
