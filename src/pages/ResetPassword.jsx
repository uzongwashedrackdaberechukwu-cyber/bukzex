import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, LockKeyhole } from "lucide-react";
import { updatePassword } from "../services/auth";
import WhatsAppSupport from "../components/WhatsAppSupport";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await updatePassword(password);
      setMessage("Your password has been updated. You can sign in now.");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(err.message || "The reset link is invalid or expired. Request a new link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-background-orb login-orb-one" />
      <div className="login-background-orb login-orb-two" />
      <div className="login-grid" />
      <div className="login-container">
        <Link to="/" className="login-brand" aria-label="BukzEx home">
          <span className="login-brand-mark">B</span>
          <span className="login-brand-name">Bukz<span>Ex</span></span>
        </Link>

        <section className="login-card">
          <div className="login-card-header">
            <div className="login-card-icon"><LockKeyhole size={22} /></div>
            <span className="login-eyebrow">ACCOUNT SECURITY</span>
            <h1>Choose a new password</h1>
            <p>Enter and confirm a password with at least 8 characters.</p>
          </div>

          <form className="login-form" onSubmit={submit}>
            <div className="login-field">
              <label htmlFor="new-password">New password</label>
              <div className="login-password-wrapper">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <div className="login-password-wrapper">
                <input
                  id="confirm-password"
                  type={showConfirmation ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowConfirmation((visible) => !visible)}
                  aria-label={showConfirmation ? "Hide password" : "Show password"}
                >
                  {showConfirmation ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && <div className="login-notice error" role="alert">{error}</div>}
            {message && <div className="login-notice success" role="status" aria-live="polite">{message}</div>}

            <button className="login-submit" type="submit" disabled={loading}>
              <span>{loading ? "Updating password..." : "Update password"}</span>
              <span className="login-submit-icon"><ArrowRight size={16} /></span>
            </button>
          </form>

          <div className="login-signup">
            <Link to="/login">Back to sign in</Link>
          </div>
        </section>
      </div>
      <WhatsAppSupport />
    </main>
  );
}
