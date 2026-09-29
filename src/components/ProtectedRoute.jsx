import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  getSession,
  isAuthenticated,
} from "../services/auth";

export default function ProtectedRoute() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const session = getSession();

  if (session?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
