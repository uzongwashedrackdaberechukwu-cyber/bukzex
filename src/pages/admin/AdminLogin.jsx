import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { loginAdmin } from "../../services/adminAuth";

import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your admin email and password.");
      return;
    }

    try {
      setLoading(true);

      loginAdmin(email, password);

      navigate("/admin", { replace: true });
    } catch (err) {
      setError(
        err?.message || "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-glow admin-login-glow-one" />
      <div className="admin-login-glow admin-login-glow-two" />

      <div className="admin-login-grid" />

      <section className="admin-login-card">
        <div className="admin-login-brand">
          <span className="admin-login-logo">B</span>

          <div>
            <strong>
              Bukz<span>Ex</span>
            </strong>

            <small>ADMIN PANEL</small>
          </div>
        </div>

        <div className="admin-login-heading">
          <div className="admin-login-icon">
            <ShieldCheck size={22} />
          </div>

          <span>ADMINISTRATOR ACCESS</span>

          <h1>
            Welcome to
            <strong> BukzEx.</strong>
          </h1>

          <p>
            Sign in to manage customers, deposits,
            orders and platform services.
          </p>
        </div>

        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
        >
          <div className="admin-login-field">
            <label htmlFor="admin-email">
              Admin email
            </label>

            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="admin@bukzex.com"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password">
              Password
            </label>

            <div className="admin-login-password">
              <input
                id="admin-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter admin password"
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >
            <span>
              {loading
                ? "Signing In..."
                : "Sign In to Admin"}
            </span>

            <ArrowRight size={17} />
          </button>
        </form>

        <div className="admin-login-demo">
          <span>Demo admin</span>

          <code>admin@bukzex.com</code>
          <code>admin123</code>
        </div>
      </section>
    </main>
  );
}
