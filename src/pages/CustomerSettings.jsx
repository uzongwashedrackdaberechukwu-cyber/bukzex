import {
  ArrowLeft,
  Settings,
  Bell,
  ShieldCheck,
} from "lucide-react";

import { useState } from "react";
import { Link } from "react-router-dom";

import "./CustomerSettings.css";

export default function CustomerSettings() {
  const [notifications, setNotifications] = useState(true);
  const [message, setMessage] = useState("");

  function handleSave() {
    setMessage("Settings saved.");
  }

  return (
    <main className="customer-settings-page">
      <div className="customer-settings-container">

        <Link
          to="/customer"
          className="customer-settings-back"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="customer-settings-heading">
          <div className="customer-settings-icon">
            <Settings size={24} />
          </div>

          <div>
            <span>BUKZEX ACCOUNT</span>
            <h1>Settings</h1>
            <p>Manage your account preferences.</p>
          </div>
        </div>

        <section className="customer-settings-card">

          <div className="customer-setting-row">
            <div className="customer-setting-info">
              <div className="customer-setting-small-icon">
                <Bell size={18} />
              </div>

              <div>
                <h2>Notifications</h2>
                <p>
                  Receive notifications about your orders and wallet.
                </p>
              </div>
            </div>

            <label className="customer-switch">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(event) =>
                  setNotifications(event.target.checked)
                }
              />

              <span></span>
            </label>
          </div>

          <div className="customer-setting-divider" />

          <div className="customer-setting-row">
            <div className="customer-setting-info">
              <div className="customer-setting-small-icon">
                <ShieldCheck size={18} />
              </div>

              <div>
                <h2>Account Security</h2>
                <p>
                  Your account security settings will be managed here.
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div className="customer-settings-message">
              {message}
            </div>
          )}

          <button
            type="button"
            className="customer-settings-save"
            onClick={handleSave}
          >
            Save Settings
          </button>

        </section>

      </div>
    </main>
  );
}
