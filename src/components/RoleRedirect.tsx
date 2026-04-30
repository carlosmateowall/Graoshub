import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ContratanteHome from "@/components/screens/ContratanteHome";

const RoleRedirect = () => {
  const { role } = useAuth();

  if (role === "motorista") return <Navigate to="/fretes" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;

  return <ContratanteHome />;
};

export default RoleRedirect;
