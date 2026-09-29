import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updatePassword } from "../services/auth";
import { isSupabaseConfigured } from "../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
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
      <section className="login-card">
        <h1>Choose a new password</h1>
        <p>Use the password reset link sent to your email.</p>
        {!isSupabaseConfigured && <p role="status">Account services are not connected yet.</p>}
        <form className="login-form" onSubmit={submit}>
          <label htmlFor="new-password">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <label htmlFor="confirm-password">Confirm new password</label>
          <input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
          {error && <p role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}
          <button className="login-submit" type="submit" disabled={loading || !isSupabaseConfigured}>{loading ? "Updating..." : "Update password"}</button>
        </form>
        <p><Link to="/login">Back to sign in</Link></p>
      </section>
    </main>
  );
}
