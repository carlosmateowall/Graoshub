import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ArrowLeft, Bell, BellRing, BellOff } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Notificacao = Tables<"notificacoes"> & { url?: string | null };

const NotificacoesScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("notificacoes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      if (data) setNotifs(data);
      setLoading(false);
    };
    load();
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const handleClick = async (n: Notificacao) => {
    if (!n.lida) await markRead(n.id);
    if (n.url) navigate(n.url);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notificacoes").update({ lida: true }).eq("user_id", user.id).eq("lida", false);
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const fmtTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const unreadCount = notifs.filter(n => !n.lida).length;

  return (
    <div className="absolute inset-0 bg-background overflow-y-auto phone-scroll">
      <div className="px-5 pt-14 pb-28">
        <button onClick={() => navigate("/perfil")} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-6">
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Notificações</h1>
            <p className="text-sm text-muted-foreground">{unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-bold text-primary bg-transparent border-none cursor-pointer px-3 py-3 min-h-[48px] rounded-lg hover:bg-primary/5 transition-colors">Marcar todas</button>
          )}
        </div>
        {isSupported && permission === "default" && (
          <button
            onClick={requestPermission}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border-2 border-primary/20 mb-5 cursor-pointer active:scale-[0.98] transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BellRing size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-foreground block">Ativar notificações</span>
              <span className="text-xs text-muted-foreground">Receba alertas de novos fretes e propostas mesmo com o app em segundo plano</span>
            </div>
            <span className="text-xs font-bold text-primary flex-shrink-0">Ativar</span>
          </button>
        )}

        {isSupported && permission === "denied" && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border mb-5">
            <BellOff size={18} className="text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Notificações bloqueadas. Para ativar, clique no cadeado na barra de endereço do seu navegador e permita notificações.
            </p>
          </div>
        )}

        {isSupported && permission === "granted" && (
          <div className="flex items-center gap-2 mb-5 px-1">
            <BellRing size={14} className="text-success" />
            <span className="text-xs font-semibold text-success">Notificações ativas</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">{[1, 2, 3].map(i => <div key={i} className="h-20 skeleton-shimmer" />)}</div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mb-4"><Bell size={32} className="text-primary" /></div>
            <h3 className="text-lg font-bold text-foreground mb-1">Sem notificações</h3>
            <p className="text-sm text-muted-foreground">Você será notificado sobre seus fretes aqui</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {notifs.map(n => (
              <button key={n.id} onClick={() => handleClick(n)}
                className={`w-full text-left p-4 rounded-2xl transition-colors min-h-[64px] ${n.url ? "cursor-pointer active:scale-[0.99]" : "cursor-default"} ${n.lida ? "bg-card shadow-sm" : "bg-primary/5 shadow-card-soft border border-primary/15"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className={`text-[13px] font-semibold block ${n.lida ? "text-muted-foreground" : "text-foreground"}`}>{n.titulo}</span>
                    <span className="text-[12px] text-muted-foreground mt-0.5 block">{n.mensagem}</span>
                    {n.url && <span className="text-[11px] text-primary font-semibold mt-1 block">Ver detalhes →</span>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[11px] text-muted-foreground">{fmtTime(n.created_at)}</span>
                    {!n.lida && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificacoesScreen;
