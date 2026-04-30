import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Package, Truck, ShoppingCart, Map, User, Settings, MapPin, Wheat, Bell, LogOut } from "lucide-react";

interface DesktopSidebarProps {
  items: { path: string; icon: string; label: string }[];
  active: string;
  onNavigate: (path: string) => void;
  onLogout?: () => void;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  home: Home,
  "package": Package,
  truck: Truck,
  "shopping-cart": ShoppingCart,
  map: Map,
  user: User,
  settings: Settings,
  "map-pin": MapPin,
};

const DesktopSidebar = ({ items, active, onNavigate, onLogout }: DesktopSidebarProps) => {
  const { user, profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("lida", false);
      setUnreadCount(count ?? 0);
    };
    load();
    const channel = supabase
      .channel("sidebar-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "notificacoes", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <aside className="hidden lg:flex flex-col w-[260px] min-h-screen bg-sidebar border-r border-sidebar-border flex-shrink-0">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-accent flex items-center justify-center">
            <Wheat size={22} className="text-sidebar-primary" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-sidebar-foreground tracking-tight leading-none">
              Grão<span className="text-sidebar-primary">Hub</span>
            </h1>
            <p className="text-[10px] text-sidebar-foreground/40 tracking-widest uppercase">Logística Agrícola</p>
          </div>
        </div>
      </div>

      {/* Profile mini */}
      {profile && (
        <div className="mx-4 mb-6 px-3 py-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-sidebar-accent flex items-center justify-center flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-sidebar-foreground/50" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{profile.nome?.split(" ")[0] || "Usuário"}</p>
              <p className="text-[11px] text-sidebar-foreground/40 truncate">{profile.cidade || "—"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1">
        <p className="text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-widest px-3 mb-2">Menu</p>
        {items.map((item) => {
          const isActive = active === item.path;
          const showBadge = item.path === "/perfil" && unreadCount > 0;
          const IconComp = iconMap[item.icon] || Home;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer border-none transition-all text-left group ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "bg-transparent text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <div className="relative">
                <IconComp size={18} strokeWidth={isActive ? 2.2 : 1.6} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[13px] font-semibold">{item.label}</span>
            </button>
          );
        })}

        {/* Notifications shortcut */}
        <button
          onClick={() => onNavigate("/notificacoes")}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer border-none bg-transparent text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all text-left"
        >
          <div className="relative">
            <Bell size={18} strokeWidth={1.6} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-0.5">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[13px] font-semibold">Notificações</span>
        </button>
      </nav>

      {/* Logout */}
      {onLogout && (
        <div className="px-3 pb-6 pt-4 border-t border-sidebar-border mt-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer border-none bg-transparent text-sidebar-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-all text-left"
          >
            <LogOut size={18} />
            <span className="text-[13px] font-semibold">Sair</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default DesktopSidebar;
