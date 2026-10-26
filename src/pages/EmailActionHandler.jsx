import { useEffect, useState } from "react";
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "../lib/firebase";

const pendingVerifications = new Map();

function verifyEmailCode(code) {
  if (!pendingVerifications.has(code)) {
    pendingVerifications.set(code, applyActionCode(auth, code));
  }
  return pendingVerifications.get(code);
}

function getContinueUrl(value, mode) {
  const fallback = new URL("/login", window.location.origin);
  if (mode === "verifyEmail") fallback.searchParams.set("emailVerified", "1");
  if (mode === "resetPassword") fallback.searchParams.set("passwordReset", "1");
  if (mode === "recoverEmail") fallback.searchParams.set("emailRecovered", "1");
  if (!value) return fallback.toString();

  try {
    const destination = new URL(value, window.location.origin);
    if (
      destination.origin !== window.location.origin ||
      destination.pathname !== "/login"
    ) {
      return fallback.toString();
    }
    if (mode === "verifyEmail") destination.searchParams.set("emailVerified", "1");
    if (mode === "resetPassword") destination.searchParams.set("passwordReset", "1");
    if (mode === "recoverEmail") destination.searchParams.set("emailRecovered", "1");
    destination.hash = "";
    return destination.toString();
  } catch {
    return fallback.toString();
  }
}

export default function EmailActionHandler() {
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Confirming your email address…");
  const [loginUrl, setLoginUrl] = useState("/login");
  const [accountEmail, setAccountEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const code = params.get("oobCode");
    const destination = getContinueUrl(params.get("continueUrl"), mode);
    setLoginUrl(destination);

    if (!code || !["verifyEmail", "resetPassword", "recoverEmail"].includes(mode)) {
      setStatus("error");
      setLoginUrl(new URL("/login", window.location.origin).toString());
      setMessage("This email action link is incomplete or invalid.");
      return undefined;
    }

    let redirectTimer;
    const completeAction = () => {
      if (mode === "verifyEmail") {
        return verifyEmailCode(code).then(() => {
          setStatus("success");
          setMessage("Your email address has been confirmed. Taking you to sign in…");
          redirectTimer = window.setTimeout(() => window.location.replace(destination), 1200);
        });
      }
      if (mode === "resetPassword") {
        return verifyPasswordResetCode(auth, code).then((email) => {
          setAccountEmail(email);
          setStatus("reset-ready");
          setMessage("Choose a new password for your BukzEx account.");
        });
      }
      return checkActionCode(auth, code)
        .then(() => applyActionCode(auth, code))
        .then(() => {
          setStatus("success");
          setMessage("Your previous email address has been restored. Taking you to sign in…");
          redirectTimer = window.setTimeout(() => window.location.replace(destination), 1200);
        });
    };

    completeAction().catch(() => {
      setStatus("error");
      setLoginUrl(new URL("/login", window.location.origin).toString());
      setMessage("This link has expired or has already been used. Return to sign in and request a fresh link if needed.");
    });

    return () => window.clearTimeout(redirectTimer);
  }, []);

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setFormError("");
    if (password.length < 6) {
      setFormError("Use a password with at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("The passwords do not match.");
      return;
    }

    const code = new URLSearchParams(window.location.search).get("oobCode");
    try {
      setSavingPassword(true);
      await confirmPasswordReset(auth, code, password);
      setStatus("success");
      setMessage("Your password has been changed. Taking you to sign in…");
      window.setTimeout(() => window.location.replace(loginUrl), 1200);
    } catch {
      setLoginUrl(new URL("/login", window.location.origin).toString());
      setFormError("We could not change the password. Request a new reset link and try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <main className="email-action-page">
      <section className="email-action-card" aria-live="polite">
        <span className="email-action-brand">Bukz<span>Ex</span></span>
        <h1>{status === "success" ? "Action complete" : status === "error" ? "Unable to complete action" : status === "reset-ready" ? "Reset your password" : "Confirming your email"}</h1>
        <p>{message}</p>
        {status === "reset-ready" && (
          <form className="email-action-form" onSubmit={handlePasswordSubmit}>
            {accountEmail && <p className="email-action-account">{accountEmail}</p>}
            <label htmlFor="new-password">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} />
            <label htmlFor="confirm-password">Confirm new password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            {formError && <p className="email-action-error" role="alert">{formError}</p>}
            <button className="email-action-button" type="submit" disabled={savingPassword}>{savingPassword ? "Saving…" : "Change password"}</button>
          </form>
        )}
        {["success", "error"].includes(status) && (
          <a className="email-action-button" href={loginUrl}>
            Continue to sign in
          </a>
        )}
      </section>

    </main>
  );
}
