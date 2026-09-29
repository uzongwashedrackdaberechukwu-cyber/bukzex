import {
  ArrowLeft,
  UserRound,
  Save,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSession, updateSession } from "../services/auth";

import "./CustomerProfile.css";

export default function CustomerProfile() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSession()
      .then((user) => {
        if (user) setProfile(user);
      })
      .catch((err) => setError(err.message || "Unable to load your profile."));
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const updated = await updateSession(profile);
      setProfile(updated);
      setMessage("Your profile has been updated.");
    } catch (err) {
      setError(err.message || "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="customer-profile-page">
      <div className="customer-profile-container">

        <Link
          to="/customer"
          className="customer-profile-back"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="customer-profile-heading">
          <div className="customer-profile-icon">
            <UserRound size={24} />
          </div>

          <div>
            <span>BUKZEX ACCOUNT</span>
            <h1>Profile</h1>
            <p>Manage your account information.</p>
          </div>
        </div>

        <form
          className="customer-profile-card"
          onSubmit={handleSubmit}
        >
          <div className="customer-profile-grid">

            <div className="customer-profile-field">
              <label htmlFor="profile-first-name">
                First Name
              </label>

              <input
                id="profile-first-name"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                placeholder="First name"
              />
            </div>

            <div className="customer-profile-field">
              <label htmlFor="profile-last-name">
                Last Name
              </label>

              <input
                id="profile-last-name"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                placeholder="Last name"
              />
            </div>

            <div className="customer-profile-field">
              <label htmlFor="profile-email">
                Email Address
              </label>

              <input
                id="profile-email"
                name="email"
                type="email"
                value={profile.email}
                placeholder="Email address"
                readOnly
                aria-describedby="profile-email-help"
              />
              <small id="profile-email-help">Email changes are managed through account security.</small>
            </div>

            <div className="customer-profile-field">
              <label htmlFor="profile-phone">
                Phone Number
              </label>

              <input
                id="profile-phone"
                name="phone"
                type="tel"
                value={profile.phone}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </div>

          </div>

          {message && (
            <div className="customer-profile-message">
              {message}
            </div>
          )}
          {error && <div className="customer-profile-message" role="alert">{error}</div>}

          <button
            type="submit"
            className="customer-profile-save"
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

      </div>
    </main>
  );
}
