import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyError } from "@/lib/friendlyError";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Package, MapPin, Warehouse, ShoppingCart, TrendingUp, CheckCircle2, Truck, Bell, Plus, ArrowRight, User, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAppLayout } from "@/hooks/useAppLayout";

interface Carga { id: string; tipo_grao: string; quantidade: number; origem: string; destino: string; valor: number; status: string; }
interface FreteAtivo { id: string; status: string; carga: Carga; }

const ContratanteHome = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useAppLayout();
  const online = useOnlineStatus();
  const [fretesAtivos, setFretesAtivos] = useState<FreteAtivo[]>([]);
  const [cargasRecentes, setCargasRecentes] = useState<Carga[]>([]);
  const [stats, setStats] = useState({ ativos: 0, aguardando: 0, concluidos: 0 });
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
    const { data: cargas } = await supabase.from("cargas").select("*").eq("contratante_id", user.id).order("created_at", { ascending: false });
    if (cargas) {
      setStats({ ativos: cargas.filter(c => c.status === "em_andamento").length, aguardando: cargas.filter(c => c.status === "disponivel").length, concluidos: cargas.filter(c => c.status === "concluida").length });
      setCargasRecentes(cargas.slice(0, 5) as Carga[]);
    }
    const cargaIds = cargas?.map(c => c.id) || [];
    const { data: fretes } = cargaIds.length > 0
      ? await supabase.from("fretes").select("id, status, carga_id").in("status", ["aceito", "em_coleta", "em_transito", "aguardando_confirmacao"]).in("carga_id", cargaIds)
      : { data: [] };
    if (fretes && cargas) {
      setFretesAtivos(fretes.map(f => { const carga = cargas.find(c => c.id === f.carga_id); return carga ? { id: f.id, status: f.status, carga: carga as Carga } : null; }).filter(Boolean) as FreteAtivo[]);
    }
    const { count } = await supabase.from("notificacoes").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("lida", false);
    setUnread(count ?? 0);
    } catch {
      toast("Erro ao carregar dados. Tente novamente.");
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;
    loadData();
    const channel = supabase.channel("home-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cargas", filter: `contratante_id=eq.${user.id}` }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "fretes" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleRefresh = useCallback(async () => { await loadData(); }, [loadData]);
  const { scrollRef, onTouchStart, onTouchMove, onTouchEnd, pullIndicator } = usePullToRefresh(handleRefresh);

  const statusLabel: Record<string, string> = { aceito: "Aceito", em_coleta: "Em Coleta", em_transito: "Em Transporte", aguardando_confirmacao: "Confirmar Recebimento" };
  const statusColor: Record<string, string> = { aceito: "bg-primary/10 text-primary", em_coleta: "bg-accent/15 text-accent-foreground", em_transito: "bg-info/15 text-info", aguardando_confirmacao: "bg-accent/20 text-accent-foreground" };

  const handleCancelCarga = async () => {
    if (!cancelId || !online) { toast("Sem conexão"); return; }
    setCancelling(true);
    const { error } = await supabase.from("cargas").update({ status: "cancelada" }).eq("id", cancelId);
    if (error) toast(friendlyError(error.message)); else { toast("Carga cancelada."); loadData(); }
    setCancelling(false); setCancelId(null);
  };

  const Skeleton = () => (<div className="flex flex-col gap-3 mt-4"><div className="h-20 skeleton-shimmer" /><div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="h-20 skeleton-shimmer" />)}</div><div className="h-24 skeleton-shimmer" /></div>);

  return (
    <>
    <div ref={scrollRef} className="absolute inset-0 overflow-y-auto phone-scroll bg-background" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {pullIndicator}
      <div className="relative overflow-hidden px-5 lg:px-8 pt-3 pb-24 gradient-hero animate-fade-in">
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-background" style={{ borderRadius: "24px 24px 0 0" }} />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/perfil")} className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center border border-white/10 cursor-pointer overflow-hidden lg:hidden" aria-label="Perfil">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={18} className="text-white/60" />}
              </button>
              <div>
                <p className="text-[11px] lg:text-xs text-white/35 font-medium tracking-widest uppercase">GrãoHub</p>
                <p className="text-[18px] lg:text-2xl font-bold text-white tracking-tight">Olá, {profile?.nome?.split(" ")[0] || "Usuário"}</p>
              </div>
            </div>
            <button onClick={() => navigate("/notificacoes")} className="relative w-10 h-10 rounded-full bg-white/8 flex items-center justify-center border border-white/10 cursor-pointer lg:hidden" aria-label="Notificações">
              <Bell size={18} className="text-white/70" />
              {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}
            </button>
          </div>
          <div className="flex gap-2.5 lg:gap-4">
            {[{ num: stats.ativos, label: "Ativos", icon: Truck }, { num: stats.aguardando, label: "Aguardando", icon: Package }, { num: stats.concluidos, label: "Concluídos", icon: CheckCircle2 }].map(s => (
              <div key={s.label} className="flex-1 rounded-2xl p-3.5 lg:p-5 border border-white/8" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-1.5 mb-1.5"><s.icon size={13} className="text-white/30" /><span className="text-[10px] lg:text-xs text-white/40 font-medium">{s.label}</span></div>
                <span className="text-[22px] lg:text-3xl font-extrabold text-white">{s.num}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? <div className="px-5 lg:px-8 max-w-5xl mx-auto"><Skeleton /></div> : (
        <div className="px-5 lg:px-8 -mt-4 relative z-10 pb-28 lg:pb-12 animate-slide-up max-w-5xl mx-auto">
          <button onClick={() => { if (!online) { toast("Sem conexão"); return; } navigate("/publicar"); }} className="w-full flex items-center justify-between p-4 lg:p-5 rounded-2xl cursor-pointer border-none active:scale-[0.98] hover:shadow-float hover:-translate-y-0.5 transition-all duration-300 shadow-lg mb-5 bg-accent text-accent-foreground">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/20 flex items-center justify-center"><Plus size={20} className="text-accent-foreground" /></div>
              <div className="text-left"><span className="text-[15px] lg:text-base font-bold text-accent-foreground block">Publicar Nova Carga</span><span className="text-[12px] lg:text-sm text-accent-foreground/60">Encontre motoristas rapidamente</span></div>
            </div>
            <ArrowRight size={18} className="text-accent-foreground/50" />
          </button>

          {fretesAtivos.length > 0 && (
            <div className="mb-6">
              <h2 className="text-[12px] lg:text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Em andamento</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {fretesAtivos.map((f) => (
                  <button key={f.id} onClick={() => navigate(`/fretes/${f.id}/status`)} className="w-full bg-card rounded-2xl p-4 text-left cursor-pointer shadow-card-soft active:scale-[0.99] hover:shadow-float hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex justify-between items-start mb-2.5">
                      <span className="text-[15px] lg:text-base font-bold text-foreground">{f.carga.tipo_grao} — {f.carga.quantidade}t</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] lg:text-[11px] font-bold ${statusColor[f.status] || "bg-muted text-muted-foreground"}`}>{statusLabel[f.status] || f.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] lg:text-sm text-muted-foreground"><MapPin size={12} className="text-primary/60" /><span>{f.carga.origem}</span><ArrowRight size={12} className="text-primary/40" /><span>{f.carga.destino}</span></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-[12px] lg:text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Ações rápidas</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { icon: MapPin, label: "Status Fretes", desc: "Acompanhar", action: () => fretesAtivos.length > 0 ? navigate(`/fretes/${fretesAtivos[0].id}/status`) : toast("Nenhum frete em andamento.") },
              { icon: Warehouse, label: "Galpões", desc: "Mapa de armazéns", action: () => navigate("/mapa") },
              { icon: ShoppingCart, label: "Marketplace", desc: "Comprar e vender", action: () => navigate("/marketplace") },
              { icon: TrendingUp, label: "Histórico", desc: "Fretes anteriores", action: () => navigate("/historico") },
            ].map((a) => (
              <button key={a.label} onClick={a.action} className="bg-card rounded-2xl p-4 lg:p-5 flex flex-col gap-2 items-start cursor-pointer shadow-card-soft active:scale-[0.97] hover:shadow-float hover:-translate-y-0.5 transition-all duration-300 min-h-[96px]">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/8 flex items-center justify-center"><a.icon size={18} className="text-primary" /></div>
                <div><span className="text-[13px] lg:text-sm font-bold text-foreground leading-tight block">{a.label}</span><span className="text-[11px] lg:text-xs text-muted-foreground">{a.desc}</span></div>
              </button>
            ))}
          </div>

          {cargasRecentes.length > 0 && (
            <>
              <h2 className="text-[12px] lg:text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Recentes</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {cargasRecentes.map((c) => {
                  const statusMap: Record<string, { label: string; cls: string }> = { disponivel: { label: "Disponível", cls: "bg-accent/10 text-accent-foreground" }, em_andamento: { label: "Em andamento", cls: "bg-info/10 text-info" }, concluida: { label: "Concluído", cls: "bg-success/10 text-primary" }, cancelada: { label: "Cancelada", cls: "bg-destructive/10 text-destructive" } };
                  const s = statusMap[c.status] || { label: c.status, cls: "bg-muted text-muted-foreground" };
                  return (
                    <div key={c.id} className="bg-card rounded-2xl p-4 shadow-card-soft hover:shadow-float hover:-translate-y-0.5 transition-all duration-300">
                      <div className="flex justify-between items-center">
                        <div><span className="text-[14px] lg:text-base font-bold text-foreground block">{c.tipo_grao} · {c.quantidade}t</span><span className="text-[12px] lg:text-sm text-muted-foreground mt-0.5 block">{c.origem} → {c.destino}</span></div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] lg:text-[11px] font-bold ${s.cls}`}>{s.label}</span>
                          {c.status === "disponivel" && (<button onClick={() => setCancelId(c.id)} className="w-8 h-8 rounded-lg bg-destructive/8 flex items-center justify-center border-none cursor-pointer hover:bg-destructive/15 transition-colors" aria-label="Cancelar carga"><X size={14} className="text-destructive" /></button>)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {fretesAtivos.length === 0 && cargasRecentes.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4"><Package size={32} className="text-primary" /></div>
              <h3 className="text-lg font-bold text-foreground mb-1">Nenhuma carga ainda</h3>
              <p className="text-sm text-muted-foreground mb-6">Publique sua primeira carga para encontrar motoristas</p>
              <button onClick={() => navigate("/publicar")} className="px-8 py-3.5 rounded-xl font-bold text-sm border-none cursor-pointer bg-primary text-primary-foreground shadow-md active:scale-[0.98] hover:shadow-lg hover:opacity-90 transition-all">Publicar Carga</button>
            </div>
          )}
        </div>
      )}
    </div>

    <Dialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
      <DialogContent className="max-w-[440px] rounded-2xl">
        <DialogHeader><DialogTitle className="text-lg text-destructive">Cancelar Carga</DialogTitle><DialogDescription>Tem certeza que deseja cancelar esta carga? Ela será removida dos fretes disponíveis.</DialogDescription></DialogHeader>
        <div className="flex gap-3 mt-2">
          <button onClick={() => setCancelId(null)} className="flex-1 py-3 rounded-lg border border-border bg-card text-foreground font-semibold cursor-pointer hover:bg-muted transition-colors">Voltar</button>
          <button onClick={handleCancelCarga} disabled={cancelling} className="flex-1 py-3 rounded-lg bg-destructive text-destructive-foreground font-semibold border-none cursor-pointer disabled:opacity-50 hover:bg-destructive/90 transition-colors">{cancelling ? "Cancelando..." : "Confirmar"}</button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ContratanteHome;
