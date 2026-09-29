import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginUser, requestPasswordReset } from "../services/auth";
import { isSupabaseConfigured } from "../lib/supabase";

import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  Headphones,
} from "lucide-react";

import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] =
    useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetNotice, setResetNotice] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handlePasswordReset() {
    setError("");
    setResetNotice("");
    if (!email.trim()) {
      setError("Enter your email address first, then choose Forgot password.");
      return;
    }
    try {
      setResetLoading(true);
      await requestPasswordReset(email);
      setResetNotice("If an account uses that email, a password reset link has been sent.");
    } catch (err) {
      setError(err?.message || "Unable to send a reset link.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError(
        "Enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const user = await loginUser(
        cleanEmail,
        password
      );

      if (user.role === "admin") {
        navigate(location.state?.from?.pathname || "/admin", {
          replace: true,
        });
      } else {
        navigate(location.state?.from?.pathname || "/customer", {
          replace: true,
        });
      }
    } catch (err) {
      setError(
        err?.message ||
          "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-background-orb login-orb-one"></div>
      <div className="login-background-orb login-orb-two"></div>

      <div className="login-grid"></div>

      <div className="login-container">
        <a href="/" className="login-brand">
          <span className="login-brand-mark">
            B
          </span>

          <span className="login-brand-name">
            Bukz<span>Ex</span>
          </span>
        </a>

        <section className="login-card">
          <div className="login-card-header">
            <div className="login-card-icon">
              B
            </div>

            <span className="login-eyebrow">
              WELCOME BACK
            </span>

            <h1>
              Sign in to
              <span> BukzEx.</span>
            </h1>

            <p>
              Access your BukzEx account and
              continue using the services available
              to you.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <div className="login-field">
              <label htmlFor="login-email">
                Email address
              </label>

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email address"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="login-password">
                  Password
                </label>

                <button
                  type="button"
                  className="login-forgot-button"
                  onClick={handlePasswordReset}
                  disabled={resetLoading || !isSupabaseConfigured}
                >
                  {resetLoading ? "Sending..." : "Forgot password?"}
                </button>
              </div>

              <div className="login-password-wrapper">
                <input
                  id="login-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
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

            {resetNotice && (
              <div className="login-error" role="status">
                {resetNotice}
              </div>
            )}

            {!isSupabaseConfigured && (
              <div className="login-error" role="status">
                BukzEx account services are being connected. Sign-in will be available when setup is complete.
              </div>
            )}

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <div className="login-options">
              <label className="login-remember">
                <input type="checkbox" />

                <span className="login-checkmark"></span>

                <span>
                  Remember me
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading || !isSupabaseConfigured}
            >
              <span>
                {loading
                  ? "Signing In..."
                  : "Sign In"}
              </span>

              <span className="login-submit-icon">
                <ArrowRight size={16} />
              </span>
            </button>
          </form>

          <div className="login-signup">
            <span>
              Don't have an account?
            </span>

            <a href="/signup">
              Create one
            </a>
          </div>
        </section>

        <div className="login-features">
          <div className="login-feature">
            <span>
              <ShieldCheck size={14} />
            </span>

            <small>Secure</small>
          </div>

          <div className="login-feature">
            <span>
              <Zap size={14} />
            </span>

            <small>Fast</small>
          </div>

          <div className="login-feature">
            <span>
              <Headphones size={14} />
            </span>

            <small>Support</small>
          </div>
        </div>
      </div>
    </main>
  );
}
