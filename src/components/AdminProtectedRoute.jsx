import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getSession } from "../services/auth";

export default function AdminProtectedRoute() {
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    let active = true;
    getSession()
      .then((user) => {
        if (active) setState({ loading: false, user });
      })
      .catch(() => {
        if (active) setState({ loading: false, user: null });
      });

    return () => { active = false; };
  }, []);

  if (state.loading) return <main className="auth-loading">Checking your account…</main>;
  if (!state.user) return <Navigate to="/login" replace />;

  if (state.user.role !== "admin") {
    return <Navigate to="/customer" replace />;
  }

  return <Outlet />;
}
