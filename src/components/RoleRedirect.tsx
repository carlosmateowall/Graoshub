import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ContratanteHome = lazy(() => import("@/components/screens/ContratanteHome"));

const Skeleton = () => (
  <div className="absolute inset-0 flex flex-col gap-3 px-5 pt-20 bg-background">
    {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton-shimmer" />)}
  </div>
);

const RoleRedirect = () => {
  const { role } = useAuth();
  if (role === "motorista") return <Navigate to="/fretes" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return (
    <Suspense fallback={<Skeleton />}>
      <ContratanteHome />
    </Suspense>
  );
};

export default RoleRedirect;
