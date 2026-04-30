import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Package, Truck, ShoppingCart, Map, User, Settings, Bell, MapPin } from "lucide-react";

interface BottomNavProps {
  items: { path: string; icon: string; label: string }[];
  active: string;
  onNavigate: (path: string) => void;
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

const BottomNav = ({ items, active, onNavigate }: BottomNavProps) => {
  const { user } = useAuth();
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
      .channel("nav-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "notificacoes", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="bg-card/95 backdrop-blur-xl border-t border-border/60 flex items-center justify-around px-1 pb-6 pt-2.5 flex-shrink-0 relative z-[100]">
      {items.map((item) => {
        const isActive = active === item.path;
        const showBadge = item.path === "/perfil" && unreadCount > 0;
        const IconComp = iconMap[item.icon] || Home;
        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            aria-label={item.label}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 border-none bg-transparent cursor-pointer rounded-xl flex-1 transition-all duration-200 relative min-h-[48px] ${isActive ? "" : "opacity-40 hover:opacity-60"}`}
          >
            <div className={`relative flex items-center justify-center w-10 h-8 rounded-full transition-all duration-300 ${isActive ? "bg-primary/10" : ""}`}>
              <IconComp
                size={20}
                strokeWidth={isActive ? 2.2 : 1.6}
                className={`transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
              {showBadge && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
