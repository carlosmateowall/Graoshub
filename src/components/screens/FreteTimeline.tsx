import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyError } from "@/lib/friendlyError";
import { ArrowLeft, CheckCircle, Package, Truck as TruckIcon, MapPin, MessageCircle, XCircle, Clock, Navigation, NavigationOff } from "lucide-react";
import RatingModal from "@/components/RatingModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAppLayout } from "@/hooks/useAppLayout";
import { useMotoristaTracking } from "@/hooks/useMotoristaTracking";

interface FreteData {
  id: string;
  status: string;
  aceito_em: string | null;
  coletado_em: string | null;
  entregue_em: string | null;
  carga_id: string;
  motorista_id: string;
  carga: {
    tipo_grao: string;
    quantidade: number;
    origem: string;
    destino: string;
    valor: number;
    contratante_id: string;
  };
}

const FreteTimeline = () => {
  const { id: freteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useAppLayout();
  const { user } = useAuth();
  const [frete, setFrete] = useState<FreteData | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { isTracking, error: trackingError, startTracking, stopTracking } = useMotoristaTracking(freteId);

  const loadFrete = async () => {
    if (!freteId) return;
    const { data } = await supabase.from("fretes").select("id, status, aceito_em, coletado_em, entregue_em, carga_id, motorista_id").eq("id", freteId).single();
    if (data) {
      const { data: carga } = await supabase.from("cargas").select("tipo_grao, quantidade, origem, destino, valor, contratante_id").eq("id", data.carga_id).single();
      if (carga) setFrete({ ...data, carga } as FreteData);
    }
  };

  const checkRating = async () => {
    if (!freteId || !user) return;
    const { data } = await supabase.from("avaliacoes").select("id").eq("frete_id", freteId).eq("avaliador_id", user.id).maybeSingle();
    if (data) setAlreadyRated(true);
  };

  useEffect(() => {
    if (!freteId) return;
    loadFrete();
    checkRating();
    const channel = supabase.channel(`frete-${freteId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "fretes", filter: `id=eq.${freteId}` }, () => loadFrete())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freteId, user]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!frete) return;
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === "em_coleta") updates.coletado_em = new Date().toISOString();
      if (newStatus === "entregue") updates.entregue_em = new Date().toISOString();
      const { error } = await supabase.from("fretes").update(updates).eq("id", frete.id);
      if (error) toast(friendlyError(error.message));
      else {
        const msgs: Record<string, string> = { entregue: "Entrega confirmada!", aguardando_confirmacao: "Aguardando confirmação do contratante..." };
        toast(msgs[newStatus] || "Status atualizado!");
        setFrete((prev) => prev ? { ...prev, status: newStatus } : prev);
      }
    } catch {
      toast("Erro de conexão. Tente novamente.");
    }
  };

  const handleConfirmReceipt = async () => {
    if (!frete) return;
    try {
      const { error } = await supabase.from("fretes").update({ status: "entregue", entregue_em: new Date().toISOString() }).eq("id", frete.id);
      if (error) toast(friendlyError(error.message));
      else { toast("Recebimento confirmado! Entrega concluída."); setFrete((prev) => prev ? { ...prev, status: "entregue" } : prev); }
    } catch {
      toast("Erro de conexão. Tente novamente.");
    }
  };

  const handleCancel = async () => {
    if (!frete) return;
    setCancelling(true);
    try {
      const { error: freteErr } = await supabase.from("fretes").update({ status: "cancelado" }).eq("id", frete.id);
      if (freteErr) { toast(friendlyError(freteErr.message)); setCancelling(false); setShowCancel(false); return; }
      toast("Frete cancelado. A carga voltou a ficar disponível.");
      setCancelling(false); setShowCancel(false); navigate("/fretes");
    } catch {
      toast("Erro de conexão. Tente novamente.");
      setCancelling(false); setShowCancel(false);
    }
  };

  const getSteps = () => {
    const s = frete?.status || "aceito";
    const statusOrder = ["aceito", "em_coleta", "em_transito", "aguardando_confirmacao", "entregue"];
    const currentIdx = statusOrder.indexOf(s);
    return [
      { icon: CheckCircle, name: "Frete Aceito", time: frete?.aceito_em ? new Date(frete.aceito_em).toLocaleString("pt-BR") : "", status: currentIdx >= 0 ? "done" : "pending" },
      { icon: Package, name: "Coleta Realizada", time: frete?.coletado_em ? new Date(frete.coletado_em).toLocaleString("pt-BR") : "", status: currentIdx >= 1 ? "done" : currentIdx === 0 ? "active" : "pending" },
      { icon: TruckIcon, name: "Em Transporte", time: "", status: currentIdx >= 2 ? "done" : currentIdx === 1 ? "active" : "pending" },
      { icon: Clock, name: "Aguardando Confirmação", time: "", status: currentIdx >= 3 ? "done" : currentIdx === 2 ? "active" : "pending" },
      { icon: CheckCircle, name: "Entrega Concluída", time: frete?.entregue_em ? new Date(frete.entregue_em).toLocaleString("pt-BR") : "", status: currentIdx >= 4 ? "done" : currentIdx === 3 ? "active" : "pending" },
    ];
  };

  const nextAction = () => {
    if (!frete) return null;
    switch (frete.status) {
      case "aceito": return { label: "Confirmar Coleta", status: "em_coleta" };
      case "em_coleta": return { label: "Iniciar Transporte", status: "em_transito" };
      case "em_transito": return { label: "Marcar como Entregue", status: "aguardando_confirmacao" };
      default: return null;
    }
  };

  if (!frete) return (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col gap-3 w-full px-6">{[1, 2, 3].map(i => <div key={i} className="h-20 skeleton-shimmer" />)}</div>
    </div>
  );

  const steps = getSteps();
  const action = nextAction();
  const isMotorista = user && frete.motorista_id === user.id;
  const isContratante = user && frete.carga.contratante_id === user.id;
  const avaliadoId = isMotorista ? frete.carga.contratante_id : frete.motorista_id;
  const canCancel = isMotorista && ["aceito", "em_coleta"].includes(frete.status);

  return (
    <div className="absolute inset-0 overflow-y-auto phone-scroll bg-background">
      <div className="px-5 lg:px-8 pt-14 pb-28 lg:pb-12 max-w-3xl mx-auto">
        <button onClick={() => navigate(isMotorista ? "/fretes" : "/painel")} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-6">
          <ArrowLeft size={18} /> {isMotorista ? "Fretes" : "Início"}
        </button>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight mb-5">Acompanhamento</h1>

        <div className="bg-card rounded-2xl p-5 mb-6 shadow-card-soft">
          <span className="text-[18px] font-extrabold text-foreground block mb-2">{frete.carga.tipo_grao} — {frete.carga.quantidade}t</span>
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground mb-3">
            <MapPin size={12} className="text-primary/50" /><span>{frete.carga.origem}</span><span className="text-primary/40">→</span><span>{frete.carga.destino}</span>
          </div>
          <span className="text-[15px] font-extrabold text-primary">R${Number(frete.carga.valor).toLocaleString("pt-BR")}</span>
        </div>

        <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Rastreamento</h2>
        <div className="bg-card rounded-2xl p-5 shadow-card-soft mb-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex gap-4 relative">
                <div className="flex flex-col items-center w-10 flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${step.status === "done" ? "bg-primary text-primary-foreground" : step.status === "active" ? "bg-accent text-accent-foreground animate-tl-pulse" : "bg-muted text-muted-foreground/40"}`}>
                    <Icon size={18} />
                  </div>
                  {i < steps.length - 1 && (<div className={`flex-1 w-0.5 my-1 min-h-[28px] ${step.status === "done" ? "bg-primary/30" : "bg-border"}`} />)}
                </div>
                <div className="flex-1 pt-2 pb-6">
                  <span className={`text-sm font-semibold block ${step.status === "active" ? "text-accent" : step.status === "pending" ? "text-muted-foreground" : "text-foreground"}`}>{step.name}</span>
                  {step.time && <span className="text-xs text-muted-foreground">{step.time}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {action && isMotorista && (
          <button onClick={() => handleUpdateStatus(action.status)} className="w-full h-12 border-none rounded-xl text-[15px] font-bold cursor-pointer active:scale-[0.98] transition-all bg-primary text-primary-foreground shadow-md hover:opacity-90 mb-3">
            {action.label}
          </button>
        )}
        {frete.status === "aguardando_confirmacao" && isContratante && (
          <button onClick={handleConfirmReceipt} className="w-full h-12 border-none rounded-xl text-[15px] font-bold cursor-pointer active:scale-[0.98] transition-all bg-accent text-accent-foreground shadow-md hover:opacity-90 mb-3">
            ✅ Confirmar Recebimento
          </button>
        )}
        {frete.status === "aguardando_confirmacao" && isMotorista && (
          <div className="bg-accent/10 rounded-2xl p-4 text-center mb-3">
            <Clock size={20} className="text-accent mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Aguardando confirmação do contratante</p>
            <p className="text-xs text-muted-foreground mt-1">O contratante precisa confirmar o recebimento da carga</p>
          </div>
        )}
        {isMotorista && ["em_coleta", "em_transito"].includes(frete.status) && (
          <div className="mb-3">
            {trackingError && (
              <p className="text-xs text-destructive mb-2 px-1">{trackingError}</p>
            )}
            <button
              onClick={isTracking ? stopTracking : startTracking}
              className={`w-full flex items-center justify-center gap-2 h-12 rounded-xl text-[15px] font-bold cursor-pointer border-none active:scale-[0.98] transition-all ${
                isTracking
                  ? "bg-success/10 text-success border-2 border-success/30"
                  : "bg-primary text-primary-foreground shadow-md hover:opacity-90"
              }`}
            >
              {isTracking ? (
                <><NavigationOff size={16} /> Parar Rastreamento</>
              ) : (
                <><Navigation size={16} /> Compartilhar Localização</>
              )}
            </button>
            {isTracking && (
              <p className="text-xs text-success text-center mt-1.5 font-medium">
                Localização sendo compartilhada com o contratante
              </p>
            )}
          </div>
        )}

        {freteId && (
          <button onClick={() => navigate(`/fretes/${freteId}/chat`)} className="w-full flex items-center justify-center gap-2 h-12 border-2 border-border rounded-xl text-[15px] font-semibold cursor-pointer bg-transparent text-foreground active:scale-[0.98] transition-all mb-3">
            <MessageCircle size={16} /> Chat
          </button>
        )}
        {canCancel && (
          <button onClick={() => setShowCancel(true)} className="w-full flex items-center justify-center gap-2 h-12 border-2 border-destructive/20 rounded-xl text-[14px] font-semibold cursor-pointer bg-transparent text-destructive active:scale-[0.98] transition-all">
            <XCircle size={16} /> Cancelar Frete
          </button>
        )}
        {frete.status === "entregue" && (
          <div className="text-center py-6 animate-scale-fade">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-success" /></div>
            <h3 className="text-lg font-bold text-foreground mb-4">Entrega Concluída!</h3>
            {!alreadyRated && user && (
              <button onClick={() => setShowRating(true)} className="px-6 py-3 bg-accent text-accent-foreground rounded-xl font-bold border-none cursor-pointer shadow-md hover:opacity-90 active:scale-[0.98] transition-all">
                ⭐ Avaliar Parceiro
              </button>
            )}
            {alreadyRated && <p className="text-sm text-muted-foreground">Avaliação enviada ✓</p>}
          </div>
        )}
        {frete.status === "cancelado" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4"><XCircle size={32} className="text-destructive" /></div>
            <h3 className="text-lg font-bold text-foreground mb-2">Frete Cancelado</h3>
            <p className="text-sm text-muted-foreground">Este frete foi cancelado.</p>
          </div>
        )}
      </div>
      {user && (
        <RatingModal open={showRating} onClose={() => setShowRating(false)} freteId={frete.id} avaliadorId={user.id} avaliadoId={avaliadoId} onSuccess={() => { setAlreadyRated(true); toast("Avaliação enviada!"); }} />
      )}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-destructive">Cancelar Frete</DialogTitle>
            <DialogDescription>Tem certeza? A carga voltará a ficar disponível para outros motoristas.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setShowCancel(false)} className="flex-1 py-3 rounded-lg bg-card text-foreground font-semibold cursor-pointer shadow-sm border-none">Voltar</button>
            <button onClick={handleCancel} disabled={cancelling} className="flex-1 py-3 rounded-lg bg-destructive text-destructive-foreground font-semibold border-none cursor-pointer disabled:opacity-50">{cancelling ? "Cancelando..." : "Confirmar"}</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FreteTimeline;
