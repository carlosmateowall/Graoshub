import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AdminRoute = () => {
  const { role } = useAuth();

  if (role !== "admin") {
    return <Navigate to="/painel" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
