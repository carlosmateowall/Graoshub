import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Wheat } from "lucide-react";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-hero">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.08)" }}>
          <Wheat size={40} className="text-accent animate-pulse" />
        </div>
        <span className="text-white/40 text-sm tracking-widest uppercase">Carregando...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
