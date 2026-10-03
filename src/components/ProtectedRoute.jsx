import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getSession } from "../services/auth";

export default function ProtectedRoute() {
  const location = useLocation();
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
  if (!state.user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (state.user.emailVerified === false) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (state.user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
