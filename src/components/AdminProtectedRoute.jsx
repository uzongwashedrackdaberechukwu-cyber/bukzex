import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getSession } from "../services/auth";

export default function AdminProtectedRoute() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true, user: null, error: "" });

  useEffect(() => {
    let active = true;
    setState({ loading: true, user: null, error: "" });
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      if (!firebaseUser) {
        setState({ loading: false, user: null, error: "" });
        return;
      }
      try {
        const user = await getSession();
        if (active) setState({ loading: false, user, error: "" });
      } catch (error) {
        if (active) setState({ loading: false, user: null, error: error?.message || "We could not load your admin account. Try again." });
      }
    }, (error) => {
      if (active) setState({ loading: false, user: null, error: error?.message || "We could not check your sign-in." });
    });

    return () => { active = false; unsubscribe(); };
  }, [attempt]);

  if (state.loading) return <main className="auth-loading">Checking your account…</main>;
  if (state.error) return <main className="auth-loading"><p>{state.error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button></main>;
  if (!state.user) return <Navigate to="/login" replace />;

  if (state.user.role !== "admin") {
    return <Navigate to="/customer" replace />;
  }

  return <Outlet />;
}
