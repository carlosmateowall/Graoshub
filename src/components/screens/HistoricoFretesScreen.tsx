import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ArrowLeft, ClipboardList } from "lucide-react";

interface FreteComCarga {
  id: string;
  status: string;
  created_at: string;
  carga: { origem: string; destino: string; tipo_grao: string; valor: number; quantidade: number };
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  aceito: { label: "Aceito", cls: "bg-info/10 text-info" },
  em_coleta: { label: "Em coleta", cls: "bg-accent/15 text-accent-foreground" },
  em_transito: { label: "Em trânsito", cls: "bg-primary/10 text-primary" },
  aguardando_confirmacao: { label: "Aguardando", cls: "bg-accent/20 text-accent-foreground" },
  entregue: { label: "Entregue", cls: "bg-success/10 text-success" },
  cancelado: { label: "Cancelado", cls: "bg-destructive/10 text-destructive" },
};

type Tab = "ativos" | "concluidos" | "cancelados";

const HistoricoFretesScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fretes, setFretes] = useState<FreteComCarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("ativos");

  const loadFretes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("fretes")
      .select("id, status, created_at, carga:cargas(origem, destino, tipo_grao, valor, quantidade)")
      .order("created_at", { ascending: false });
    if (data) {
      setFretes(data.filter((f: any) => f.carga).map((f: any) => ({ id: f.id, status: f.status, created_at: f.created_at, carga: f.carga })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadFretes(); }, [loadFretes]);

  const handleRefresh = useCallback(async () => { await loadFretes(); }, [loadFretes]);
  const { scrollRef, onTouchStart, onTouchMove, onTouchEnd, pullIndicator } = usePullToRefresh(handleRefresh);

  const tabFilters: Record<Tab, string[]> = {
    ativos: ["aceito", "em_coleta", "em_transito", "aguardando_confirmacao"],
    concluidos: ["entregue"],
    cancelados: ["cancelado"],
  };

  const filtered = fretes.filter(f => tabFilters[tab].includes(f.status));
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const fmtVal = (n: number) => `R$${n.toLocaleString("pt-BR")}`;

  const tabs: { id: Tab; label: string }[] = [
    { id: "ativos", label: "Ativos" },
    { id: "concluidos", label: "Concluídos" },
    { id: "cancelados", label: "Cancelados" },
  ];

  return (
    <div ref={scrollRef} className="absolute inset-0 bg-background overflow-y-auto phone-scroll" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {pullIndicator}
      <div className="px-5 lg:px-8 pt-14 pb-28 lg:pb-12 max-w-5xl mx-auto">
        <button onClick={() => navigate("/perfil")} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-6 hover:text-primary transition-colors">
          <ArrowLeft size={18} /> Voltar
        </button>
        <h1 className="text-[24px] font-extrabold text-foreground tracking-tight mb-1">Histórico de Fretes</h1>
        <p className="text-sm text-muted-foreground mb-4">{fretes.length} frete{fretes.length !== 1 ? "s" : ""} no total</p>
        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border transition-all min-h-[44px] ${tab === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex flex-col gap-3">{[1, 2, 3].map(i => <div key={i} className="h-[88px] skeleton-shimmer" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mb-4"><ClipboardList size={32} className="text-primary" /></div>
            <h3 className="text-lg font-bold text-foreground mb-1">Nenhum frete</h3>
            <p className="text-sm text-muted-foreground">Nenhum frete nesta categoria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.map((f) => {
              const sc = statusConfig[f.status] || statusConfig.aceito;
              return (
                <button key={f.id} onClick={() => navigate(`/fretes/${f.id}/status`)}
                  className="w-full bg-card rounded-2xl p-4 shadow-card-soft cursor-pointer text-left active:scale-[0.99] hover:shadow-float hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <span className="text-[13px] font-semibold text-foreground block">{f.carga.origem} → {f.carga.destino}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 block">{f.carga.tipo_grao} · {f.carga.quantidade}t · {fmtDate(f.created_at)}</span>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${sc.cls}`}>{sc.label}</span>
                  </div>
                  <span className="text-[15px] font-extrabold text-primary block">{fmtVal(f.carga.valor)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricoFretesScreen;
