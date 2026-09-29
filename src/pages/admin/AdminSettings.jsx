import {
  ShieldCheck,
  User,
  Mail,
  Server,
  Info,
} from "lucide-react";

import { useEffect, useState } from "react";
import { getSession } from "../../services/auth";
import { isSupabaseConfigured } from "../../lib/supabase";
import "./AdminSettings.css";

export default function AdminSettings() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    getSession().then(setSession).catch(() => setSession(null));
  }, []);

  const apiMode = isSupabaseConfigured ? "Supabase" : "Not connected";

  return (
    <section className="admin-settings">
      <div className="admin-settings-header">
        <div>
          <span className="admin-section-kicker">
            Platform Configuration
          </span>

          <h2>Settings</h2>

          <p>
            View your administrator account and
            platform configuration.
          </p>
        </div>
      </div>

      <div className="admin-settings-grid">
        <div className="admin-settings-card">
          <div className="admin-settings-card-header">
            <div className="admin-settings-icon">
              <User size={20} />
            </div>

            <div>
              <h3>Administrator Account</h3>
              <p>Current administrator information.</p>
            </div>
          </div>

          <div className="admin-settings-list">
            <div className="admin-settings-row">
              <span>Name</span>
              <strong>
                {session?.firstName || "BukzEx"}{" "}
                {session?.lastName || "Admin"}
              </strong>
            </div>

            <div className="admin-settings-row">
              <span>Email</span>
              <strong>
                {session?.email || "admin@bukzex.com"}
              </strong>
            </div>

            <div className="admin-settings-row">
              <span>Role</span>
              <strong className="admin-settings-badge">
                <ShieldCheck size={14} />
                Administrator
              </strong>
            </div>
          </div>
        </div>

        <div className="admin-settings-card">
          <div className="admin-settings-card-header">
            <div className="admin-settings-icon">
              <Server size={20} />
            </div>

            <div>
              <h3>System Status</h3>
              <p>Current application configuration.</p>
            </div>
          </div>

          <div className="admin-settings-list">
            <div className="admin-settings-row">
              <span>Application</span>
              <strong>BukzEx</strong>
            </div>

            <div className="admin-settings-row">
              <span>API Mode</span>
              <strong
                className={`admin-settings-mode ${
                  apiMode === "Live API"
                    ? "live"
                    : "demo"
                }`}
              >
                {apiMode}
              </strong>
            </div>

            <div className="admin-settings-row">
              <span>Environment</span>
              <strong>
                {import.meta.env.MODE}
              </strong>
            </div>
          </div>
        </div>

        <div className="admin-settings-card admin-settings-full">
          <div className="admin-settings-card-header">
            <div className="admin-settings-icon">
              <Info size={20} />
            </div>

            <div>
              <h3>Platform Information</h3>
              <p>
                Important information about this
                administration panel.
              </p>
            </div>
          </div>

          <div className="admin-settings-notice">
            <Mail size={18} />

            <div>
              <strong>Live API integration</strong>

              <p>
                {isSupabaseConfigured
                  ? "BukzEx is connected to Supabase for accounts and database-backed records. Payment-provider and service-fulfillment connections still need setup."
                  : "Supabase project details have not been added to the production build yet. Add the project URL and publishable key to enable account and database services."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
