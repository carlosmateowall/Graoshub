import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  ShieldAlert,
  Truck,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Landmark,
  Radar,
  Gavel,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppLayout } from "@/hooks/useAppLayout";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminDenuncias from "@/components/admin/AdminDenuncias";
import AdminFretes from "@/components/admin/AdminFretes";
import AdminKyc from "@/components/admin/AdminKyc";
import AdminFinanceiro from "@/components/admin/AdminFinanceiro";
import AdminRadar from "@/components/admin/AdminRadar";
import AdminDisputas from "@/components/admin/AdminDisputas";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type View = "dashboard" | "users" | "kyc" | "fretes" | "denuncias" | "financeiro" | "radar" | "disputas";

const menuItems: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "users", label: "Gestão de Usuários", icon: Users },
  { id: "kyc", label: "Análise KYC", icon: ShieldAlert },
  { id: "fretes", label: "Monitorização de Fretes", icon: Truck },
  { id: "financeiro", label: "Gestão Financeira", icon: Landmark },
  { id: "radar", label: "Radar ao Vivo", icon: Radar },
  { id: "denuncias", label: "Denúncias e Suporte", icon: AlertTriangle },
  { id: "disputas", label: "Disputas de Frete", icon: Gavel },
];

const viewTitles: Record<View, string> = {
  dashboard: "Dashboard Overview",
  users: "Gestão de Usuários",
  kyc: "Análise KYC",
  fretes: "Monitorização de Fretes",
  financeiro: "Gestão Financeira",
  radar: "Radar ao Vivo",
  denuncias: "Denúncias e Suporte",
  disputas: "Disputas de Frete",
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useAppLayout();
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast("Sessão encerrada.");
  };

  const handleNav = (view: View) => {
    setActiveView(view);
    setMobileOpen(false);
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <AdminDashboard toast={toast} />;
      case "users":
        return <AdminUsers toast={toast} />;
      case "kyc":
        return <AdminKyc toast={toast} />;
      case "fretes":
        return <AdminFretes toast={toast} />;
      case "financeiro":
        return <AdminFinanceiro toast={toast} />;
      case "radar":
        return <AdminRadar toast={toast} />;
      case "denuncias":
        return <AdminDenuncias toast={toast} />;
      case "disputas":
        return <AdminDisputas toast={toast} />;
    }
  };

  /* ── Sidebar internals ── */
  const SidebarNav = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-6 border-b border-white/10">
        <ShieldCheck className="h-7 w-7 text-primary shrink-0" />
        <span className="text-lg font-bold tracking-tight text-white">
          GrãoHub <span className="text-primary">Admin</span>
        </span>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/20 text-primary border-l-[3px] border-primary"
                  : "text-slate-300 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          Sair do Painel
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-slate-950">
        <SidebarNav />
      </aside>

      {/* Mobile Sheet Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-slate-950 border-r-0 [&>button]:hidden">
          <SidebarNav />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b bg-background shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">GrãoHub Admin</span>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto bg-muted/10">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight mb-6 lg:mb-8">
              {viewTitles[activeView]}
            </h1>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
