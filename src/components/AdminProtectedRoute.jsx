import { Navigate, Outlet } from "react-router-dom";
import {
  getSession,
  isAuthenticated,
} from "../services/auth";

export default function AdminProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const session = getSession();

  if (session?.role !== "admin") {
    return <Navigate to="/customer" replace />;
  }

  return <Outlet />;
}
