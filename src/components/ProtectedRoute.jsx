import { Navigate, Outlet } from "react-router-dom";
import {
  getSession,
  isAuthenticated,
} from "../services/auth";

export default function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const session = getSession();

  if (session?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
