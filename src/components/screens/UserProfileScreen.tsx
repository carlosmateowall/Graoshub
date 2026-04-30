import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppLayout } from "@/hooks/useAppLayout";
import { Pencil, ClipboardList, ShoppingCart, Bell, Warehouse, CreditCard, FileText, LogOut, Trash2, Settings, User, Truck, Star, ChevronRight, Headphones, BarChart3 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import ProBadge from "@/components/ProBadge";

interface UserStats { total_fretes: number; valor_movimentado: number; total_anuncios: number; }
interface UserRating { media: number; total: number; }

const UserProfileScreen = () => {
  const navigate = useNavigate();
  const { toast, onDeleteAccount, onLogout } = useAppLayout();
  const { profile, user, role: authRole } = useAuth();
  const role = authRole ?? "contratante";
  const isAdmin = role === "admin";
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [rating, setRating] = useState<UserRating | null>(null);
  const { isPro } = useSubscription();

  useEffect(() => {
    if (!user || isAdmin) return;
    supabase.rpc("get_user_stats", { _user_id: user.id }).then(({ data }) => { if (data) setUserStats(data as unknown as UserStats); });
    (supabase as any).rpc("get_user_rating", { _user_id: user.id }).then(({ data }: any) => { if (data) setRating(data as UserRating); });
  }, [user, isAdmin]);

  const fmtVal = (n: number) => {
    if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `R$${Math.round(n / 1000)}k`;
    return `R$${n}`;
  };

  const roleLabel = role === "motorista" ? "Motorista" : role === "admin" ? "Administrador" : "Contratante";
  const AvatarIcon = isAdmin ? Settings : role === "motorista" ? Truck : User;

  const menuItems = isAdmin ? [
    { icon: Pencil, label: "Editar Perfil", action: () => navigate("/perfil/editar") },
    { icon: Settings, label: "Painel Administrativo", action: () => navigate("/admin") },
  ] : [
    { icon: Pencil, label: "Editar Perfil", action: () => navigate("/perfil/editar") },
    { icon: ClipboardList, label: "Histórico de Fretes", action: () => navigate("/historico") },
    { icon: ShoppingCart, label: "Meus Anúncios", action: () => navigate("/meus-anuncios"), badge: userStats?.total_anuncios },
    { icon: Bell, label: "Notificações", action: () => navigate("/notificacoes") },
    { icon: Warehouse, label: "Galpões Favoritos", action: () => navigate("/mapa") },
    { icon: CreditCard, label: "Planos e Assinatura", action: () => navigate("/planos") },
    { icon: BarChart3, label: "Analytics", action: () => navigate("/analytics"), badge: isPro ? undefined : 0 },
  ];

  return (
    <div className="absolute inset-0 overflow-y-auto phone-scroll bg-background">
      <div className="px-5 lg:px-8 pt-4 pb-8 flex flex-col items-center text-center rounded-b-3xl relative overflow-hidden gradient-hero">
        <div className="relative z-10 w-full flex flex-col items-center max-w-3xl mx-auto">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl flex items-center justify-center mb-4 overflow-hidden border border-white/10 shadow-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <AvatarIcon size={32} className="text-white/60" />}
          </div>
          <h1 className="text-[20px] lg:text-2xl font-extrabold text-white tracking-tight mb-0.5 flex items-center justify-center gap-2">
            {isAdmin ? "Administrador" : (profile?.nome || "Usuário")}
            {isPro && !isAdmin && <ProBadge size="md" />}
          </h1>
          <p className="text-[12px] lg:text-sm text-white/35 mb-5">{roleLabel} · {profile?.cidade || "—"}</p>
          {!isAdmin && (
            <div className="flex gap-8 lg:gap-12">
              <div className="text-center">
                <span className="text-[20px] lg:text-2xl font-extrabold text-accent block">{userStats?.total_fretes ?? "—"}</span>
                <span className="text-[10px] lg:text-xs text-white/35">Fretes</span>
              </div>
              <div className="text-center">
                <span className="text-[20px] lg:text-2xl font-extrabold text-accent flex items-center justify-center gap-1">
                  {rating && rating.total > 0 && <Star size={14} fill="currentColor" />}
                  {rating && rating.total > 0 ? rating.media.toFixed(1) : "—"}
                </span>
                <span className="text-[10px] lg:text-xs text-white/35">{rating && rating.total > 0 ? `${rating.total} aval.` : "Avaliação"}</span>
              </div>
              <div className="text-center">
                <span className="text-[20px] lg:text-2xl font-extrabold text-accent block">{userStats ? fmtVal(userStats.valor_movimentado) : "—"}</span>
                <span className="text-[10px] lg:text-xs text-white/35">Movimentado</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 lg:px-8 pt-5 pb-28 lg:pb-12 max-w-3xl mx-auto">
        <div className="bg-card rounded-2xl overflow-hidden shadow-card-soft mb-4">
          {menuItems.map((item, i) => (
            <button key={item.label} onClick={item.action}
              className={`w-full flex items-center gap-3.5 py-4 px-4 cursor-pointer text-left bg-transparent border-none hover:bg-muted/30 transition-colors min-h-[56px] ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0"><item.icon size={18} className="text-foreground/60" /></div>
              <span className="text-[14px] lg:text-base font-medium text-foreground flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center mr-1">{item.badge}</span>
              )}
              <ChevronRight size={16} className="text-muted-foreground/30" />
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl overflow-hidden shadow-card-soft mb-4">
          <button onClick={() => navigate("/termos")} className="w-full flex items-center gap-3.5 py-4 px-4 cursor-pointer text-left bg-transparent border-none hover:bg-muted/30 transition-colors min-h-[56px]">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"><FileText size={18} className="text-foreground/60" /></div>
            <span className="text-[14px] lg:text-base font-medium text-foreground flex-1">Termos e Privacidade</span>
            <ChevronRight size={16} className="text-muted-foreground/30" />
          </button>
          <a href="mailto:suporte@graohub.com.br" className="w-full flex items-center gap-3.5 py-4 px-4 cursor-pointer text-left bg-transparent border-none hover:bg-muted/30 transition-colors min-h-[56px] border-t border-border no-underline">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"><Headphones size={18} className="text-foreground/60" /></div>
            <span className="text-[14px] lg:text-base font-medium text-foreground flex-1">Suporte</span>
            <ChevronRight size={16} className="text-muted-foreground/30" />
          </a>
        </div>

        <button onClick={() => { if (onLogout) onLogout(); }}
          className="w-full flex items-center gap-3.5 py-4 px-4 cursor-pointer text-left border-none bg-transparent mt-2 min-h-[56px] hover:bg-destructive/5 rounded-xl transition-colors lg:hidden">
          <div className="w-10 h-10 rounded-xl bg-destructive/8 flex items-center justify-center"><LogOut size={18} className="text-destructive" /></div>
          <span className="text-[14px] font-medium text-destructive flex-1">Sair da Conta</span>
        </button>

        <button onClick={() => { if (onDeleteAccount) onDeleteAccount(); }}
          className="w-full flex items-center gap-3.5 py-3 px-4 cursor-pointer text-left border-none bg-transparent min-h-[48px] hover:bg-muted/20 rounded-xl transition-colors">
          <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center"><Trash2 size={16} className="text-muted-foreground" /></div>
          <span className="text-[12px] lg:text-sm font-medium text-muted-foreground flex-1">Excluir minha conta</span>
        </button>

        <p className="text-center mt-6 text-[10px] lg:text-xs text-muted-foreground/40 tracking-wide">GrãoHub v1.0.0</p>
      </div>
    </div>
  );
};

export default UserProfileScreen;
