import { useCallback, useState } from "react";
import { Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import DesktopSidebar from "@/components/DesktopSidebar";
import OfflineBanner from "@/components/OfflineBanner";
import ToastNotification from "@/components/ToastNotification";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const noNavPaths = [
  "/marketplace/anunciar",
  "/perfil/editar",
  "/termos",
  "/privacidade",
  "/historico",
  "/meus-anuncios",
  "/notificacoes",
  "/planos",
  "/fretes/ativos",
];

const AppLayout = () => {
  const { role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3200);
  }, []);

  const effectiveRole = role ?? "contratante";

  const pathname = location.pathname;

  // Hide nav on detail pages and certain screens
  const isDetailPage = /^\/fretes\/[^/]+/.test(pathname) || /^\/marketplace\/anuncio\/[^/]+/.test(pathname);
  const isNoNavPath = noNavPaths.some(p => pathname.startsWith(p));
  const showNav = !isDetailPage && !isNoNavPath;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
    toast("Até logo!");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast("Sessão expirada"); setShowDeleteDialog(false); return; }
      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) {
        toast(`Erro: ${res.error.message}`);
      } else {
        await signOut();
        navigate("/");
        toast("Conta excluída com sucesso.");
      }
    } catch {
      toast("Erro ao excluir conta");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getNavItems = () => {
    if (effectiveRole === "motorista") return [
      { path: "/fretes", icon: "truck", label: "Fretes" },
      { path: "/fretes/ativos", icon: "map-pin", label: "Em curso" },
      { path: "/marketplace", icon: "shopping-cart", label: "Mercado" },
      { path: "/mapa", icon: "map", label: "Mapa" },
      { path: "/perfil", icon: "user", label: "Perfil" },
    ];
    if (effectiveRole === "admin") return [
      { path: "/admin", icon: "settings", label: "Admin" },
      { path: "/painel", icon: "home", label: "Início" },
      { path: "/marketplace", icon: "shopping-cart", label: "Mercado" },
      { path: "/mapa", icon: "map", label: "Mapa" },
      { path: "/perfil", icon: "user", label: "Perfil" },
    ];
    return [
      { path: "/painel", icon: "home", label: "Início" },
      { path: "/publicar", icon: "package", label: "Publicar" },
      { path: "/marketplace", icon: "shopping-cart", label: "Mercado" },
      { path: "/mapa", icon: "map", label: "Mapa" },
      { path: "/perfil", icon: "user", label: "Perfil" },
    ];
  };

  const getActivePath = (): string => {
    if (pathname.startsWith("/fretes")) return effectiveRole === "motorista" ? "/fretes" : "/painel";
    if (pathname.startsWith("/marketplace")) return "/marketplace";
    if (pathname.startsWith("/publicar")) return "/publicar";
    if (pathname.startsWith("/admin")) return "/admin";
    if (pathname.startsWith("/perfil")) return "/perfil";
    if (pathname.startsWith("/mapa")) return "/mapa";
    if (pathname.startsWith("/painel")) return "/painel";
    return pathname;
  };

  const deleteDialog = (
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent className="max-w-[440px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-destructive">Excluir Conta</DialogTitle>
          <DialogDescription>
            Esta ação é irreversível. Todos os seus dados, fretes, anúncios e mensagens serão permanentemente removidos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-2">
          <button onClick={() => setShowDeleteDialog(false)} className="flex-1 py-3 rounded-lg border border-border bg-card text-foreground font-semibold cursor-pointer hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={handleDeleteAccount} disabled={deleting} className="flex-1 py-3 rounded-lg bg-destructive text-destructive-foreground font-semibold border-none cursor-pointer disabled:opacity-50 hover:bg-destructive/90 transition-colors">
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-background flex safe-area-container">
      <OfflineBanner />
      {showNav && (
        <DesktopSidebar
          items={getNavItems()}
          active={getActivePath()}
          onNavigate={(path) => navigate(path)}
          onLogout={handleLogout}
        />
      )}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 relative animate-fade-in" key={pathname}>
          <Outlet context={{ toast, onDeleteAccount: () => setShowDeleteDialog(true), onLogout: handleLogout }} />
        </div>
        {showNav && (
          <div className="lg:hidden">
            <BottomNav items={getNavItems()} active={getActivePath()} onNavigate={(path) => navigate(path)} />
          </div>
        )}
      </div>
      <ToastNotification message={toastMsg} />
      {deleteDialog}
    </div>
  );
};

export default AppLayout;
