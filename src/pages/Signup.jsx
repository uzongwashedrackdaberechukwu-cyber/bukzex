import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/auth";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  Headphones,
  User,
  Mail,
  Phone,
  Lock,
  Check,
} from "lucide-react";

import "./Signup.css";

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [legalNotice, setLegalNotice] = useState("");

  return (
    <main className="signup-page">

      <div className="signup-background-orb signup-orb-one"></div>
      <div className="signup-background-orb signup-orb-two"></div>

      <div className="signup-grid"></div>

      <div className="signup-container">

        {/* BRAND */}

        <a href="/" className="signup-brand">
          <span className="signup-brand-mark">B</span>

          <span className="signup-brand-name">
            Bukz<span>Ex</span>
          </span>
        </a>

        {/* LEFT INFORMATION */}

        <div className="signup-intro">

          <span className="signup-intro-label">
            JOIN BUKZEX
          </span>

          <h1>
            Everything Digital.
            <span> One Account.</span>
          </h1>

          <p>
            Create your BukzEx account and access the
            digital services available on one convenient
            platform.
          </p>

          <div className="signup-intro-features">

            <div className="signup-intro-feature">
              <span>
                <ShieldCheck size={16} />
              </span>

              <div>
                <strong>Secure Account</strong>
                <small>
                  Your account is designed with security in mind.
                </small>
              </div>
            </div>

            <div className="signup-intro-feature">
              <span>
                <Zap size={16} />
              </span>

              <div>
                <strong>One Convenient Platform</strong>
                <small>
                  Access supported digital services from one place.
                </small>
              </div>
            </div>

            <div className="signup-intro-feature">
              <span>
                <Headphones size={16} />
              </span>

              <div>
                <strong>Support When Needed</strong>
                <small>
                  Get assistance when you need help with your account.
                </small>
              </div>
            </div>

          </div>

        </div>

        {/* SIGNUP CARD */}

        <section className="signup-card">

          <div className="signup-card-header">

            <div className="signup-card-icon">
              <User size={24} />
            </div>

            <span className="signup-eyebrow">
              CREATE ACCOUNT
            </span>

            <h2>
              Join
              <span> BukzEx.</span>
            </h2>

            <p>
              Create your account to get started.
            </p>

          </div>

          <form
          className="signup-form"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");

            if (
              !firstName.trim() ||
              !lastName.trim() ||
              !email.trim() ||
              !phone.trim() ||
              !password ||
              !confirmPassword
            ) {
              setError("Please complete all required fields.");
              return;
            }

            if (password !== confirmPassword) {
              setError("Passwords do not match.");
              return;
            }

            try {
              setLoading(true);

              registerUser({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password,
              });

              navigate("/customer", { replace: true });
            } catch (err) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          }}
        >

            <p className="signup-demo-notice" role="note">
              Demo mode: account information is stored only in this browser. Do not use a real password until secure account services are connected.
            </p>

            {error && <div className="signup-error" role="alert">{error}</div>}

            {/* NAME ROW */}

            <div className="signup-name-row">

              <div className="signup-field">

                <label htmlFor="signup-first-name">
                  First name
                </label>

                <div className="signup-input-wrapper">
                  <User size={15} />

                  <input
                    id="signup-first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                    type="text"
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                </div>

              </div>

              <div className="signup-field">

                <label htmlFor="signup-last-name">
                  Last name
                </label>

                <div className="signup-input-wrapper">
                  <User size={15} />

                  <input
                    id="signup-last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                    type="text"
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                </div>

              </div>

            </div>

            {/* EMAIL */}

            <div className="signup-field">

              <label htmlFor="signup-email">
                Email address
              </label>

              <div className="signup-input-wrapper">

                <Mail size={15} />

                <input
                  id="signup-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="Enter your email address"
                  autoComplete="email"
                />

              </div>

            </div>

            {/* PHONE */}

            <div className="signup-field">

              <label htmlFor="signup-phone">
                Phone number
              </label>

              <div className="signup-input-wrapper">

                <Phone size={15} />

                <input
                  id="signup-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                  type="tel"
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="signup-field">

              <label htmlFor="signup-password">
                Password
              </label>

              <div className="signup-input-wrapper signup-password-wrapper">

                <Lock size={15} />

                <input
                  id="signup-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Create a password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="signup-password-toggle"
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
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="signup-field">

              <label htmlFor="signup-confirm-password">
                Confirm password
              </label>

              <div className="signup-input-wrapper signup-password-wrapper">

                <Lock size={15} />

                <input
                  id="signup-confirm-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>

            </div>

            {/* TERMS */}

            <label className="signup-terms">

              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(event) =>
                  setAgreeTerms(
                    event.target.checked
                  )
                }
              />

              <span className="signup-checkmark">
                {agreeTerms && <Check size={11} />}
              </span>

              <span>
                I agree to the{" "}
                <button type="button" className="signup-legal-link" onClick={() => setLegalNotice("Terms of Service have not been published yet.")}>
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" className="signup-legal-link" onClick={() => setLegalNotice("The Privacy Policy has not been published yet.")}>
                  Privacy Policy
                </button>
                .
              </span>

            </label>
            {legalNotice && <p className="signup-legal-notice" role="status">{legalNotice}</p>}

            {/* SUBMIT */}

            <button
              type="submit"
              className="signup-submit"
            >
              <span>{loading ? "Creating Account..." : "Create Account"}</span>

              <span className="signup-submit-icon">
                <ArrowRight size={16} />
              </span>
            </button>

          </form>

          {/* LOGIN */}

          <div className="signup-login">

            <span>
              Already have an account?
            </span>

            <a href="/login">
              Sign In
            </a>

          </div>

        </section>

        {/* MOBILE / BOTTOM TRUST */}

        <div className="signup-features">

          <div className="signup-feature">
            <span>
              <ShieldCheck size={14} />
            </span>
            <small>Secure</small>
          </div>

          <div className="signup-feature">
            <span>
              <Zap size={14} />
            </span>
            <small>Fast</small>
          </div>

          <div className="signup-feature">
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
