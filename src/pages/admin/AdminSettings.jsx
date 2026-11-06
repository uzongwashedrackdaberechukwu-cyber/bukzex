import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Info,
  LoaderCircle,
  RefreshCw,
  Server,
  ShieldCheck,
  User,
  Wifi,
} from "lucide-react";

import { getSession } from "../../services/auth";
import { getServices } from "../../services/api";
import { getShadexCatalogue, WORKER_URL } from "../../services/shadexCatalog";

function formatCheckedAt(value) {
  if (!value) return "Not checked yet";
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SystemStatusRow({ icon: Icon, label, value, detail, state }) {
  const isReady = state === "ready";
  const isChecking = state === "checking";

  return (
    <div className="admin-system-status-row">
      <span className="admin-system-status-icon">
        <Icon size={18} />
      </span>
      <div className="admin-system-status-copy">
        <strong>{label}</strong>
        <small>{detail}</small>
      </div>
      <span className={`admin-system-status-pill ${isReady ? "ready" : isChecking ? "checking" : "attention"}`}>
        {isChecking ? <LoaderCircle size={13} className="admin-system-spin" /> : isReady ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
        {value}
      </span>
    </div>
  );
}

export default function AdminSettings() {
  const [session, setSession] = useState(null);
  const [system, setSystem] = useState({
    auth: "checking",
    firestore: "checking",
    gateway: "checking",
  });
  const [checkedAt, setCheckedAt] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const checkSystem = useCallback(async () => {
    setRefreshing(true);

    const [sessionResult, servicesResult, catalogueResult] = await Promise.allSettled([
      getSession(),
      getServices(),
      getShadexCatalogue("vtu"),
    ]);

    const currentSession = sessionResult.status === "fulfilled" ? sessionResult.value : null;
    setSession(currentSession);

    setSystem({
      auth: sessionResult.status === "fulfilled" && Boolean(currentSession) ? "ready" : "attention",
      firestore: servicesResult.status === "fulfilled" ? "ready" : "attention",
      gateway: catalogueResult.status === "fulfilled" ? "ready" : "attention",
    });
    setCheckedAt(new Date().toISOString());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    checkSystem();
  }, [checkSystem]);

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "Not configured";
  const environment = import.meta.env.MODE || "unknown";

  return (
    <section className="admin-settings">
      <div className="admin-settings-header">
        <div>
          <span className="admin-section-kicker">Platform governance</span>
          <h2>System & administrator</h2>
          <p>
            Check the live BukzEx application connections and review the signed-in administrator account.
          </p>
        </div>
        <button
          type="button"
          className="admin-settings-refresh"
          onClick={checkSystem}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? "admin-system-spin" : ""} />
          {refreshing ? "Checking…" : "Run checks"}
        </button>
      </div>

      <div className="admin-settings-grid">
        <article className="admin-settings-card">
          <div className="admin-settings-card-header">
            <div className="admin-settings-icon"><User size={20} /></div>
            <div>
              <h3>Administrator account</h3>
              <p>Identity currently signed in to this console.</p>
            </div>
          </div>

          <div className="admin-settings-list">
            <div className="admin-settings-row">
              <span>Name</span>
              <strong>{[session?.firstName, session?.lastName].filter(Boolean).join(" ") || "Administrator"}</strong>
            </div>
            <div className="admin-settings-row">
              <span>Email</span>
              <strong>{session?.email || "Not available"}</strong>
            </div>
            <div className="admin-settings-row">
              <span>Role</span>
              <strong className="admin-settings-badge"><ShieldCheck size={14} /> Administrator</strong>
            </div>
            <div className="admin-settings-row">
              <span>Account ID</span>
              <strong className="admin-settings-mono">{session?.id || "Not available"}</strong>
            </div>
          </div>
        </article>

        <article className="admin-settings-card">
          <div className="admin-settings-card-header">
            <div className="admin-settings-icon"><Server size={20} /></div>
            <div>
              <h3>Live system health</h3>
              <p>Connection checks run from this signed-in admin session.</p>
            </div>
          </div>

          <div className="admin-system-status-list">
            <SystemStatusRow
              icon={ShieldCheck}
              label="Firebase Authentication"
              value={system.auth === "ready" ? "Authenticated" : system.auth === "checking" ? "Checking" : "Needs attention"}
              detail="Administrator session restored and verified"
              state={system.auth}
            />
            <SystemStatusRow
              icon={Database}
              label="Firestore"
              value={system.firestore === "ready" ? "Connected" : system.firestore === "checking" ? "Checking" : "Unavailable"}
              detail="Admin catalogue read permission"
              state={system.firestore}
            />
            <SystemStatusRow
              icon={Wifi}
              label="Shadex supplier gateway"
              value={system.gateway === "ready" ? "Responding" : system.gateway === "checking" ? "Checking" : "Unavailable"}
              detail="Live VTU catalogue request through BukzEx Worker"
              state={system.gateway}
            />
          </div>
          <p className="admin-system-checked-at">Last checked: {formatCheckedAt(checkedAt)}</p>
        </article>

        <article className="admin-settings-card">
          <div className="admin-settings-card-header">
            <div className="admin-settings-icon"><Database size={20} /></div>
            <div>
              <h3>Application configuration</h3>
              <p>Non-secret runtime information for this deployment.</p>
            </div>
          </div>

          <div className="admin-settings-list">
            <div className="admin-settings-row">
              <span>Application</span>
              <strong>BukzEx</strong>
            </div>
            <div className="admin-settings-row">
              <span>Data and authentication</span>
              <strong>Firebase</strong>
            </div>
            <div className="admin-settings-row">
              <span>Supplier API gateway</span>
              <strong>Cloudflare Worker</strong>
            </div>
            <div className="admin-settings-row">
              <span>Firebase project</span>
              <strong className="admin-settings-mono">{projectId}</strong>
            </div>
            <div className="admin-settings-row">
              <span>Worker endpoint</span>
              <strong className="admin-settings-mono">{WORKER_URL}</strong>
            </div>
            <div className="admin-settings-row">
              <span>Build environment</span>
              <strong>{environment}</strong>
            </div>
          </div>
        </article>

        <article className="admin-settings-card admin-settings-full">
          <div className="admin-settings-card-header">
            <div className="admin-settings-icon"><Info size={20} /></div>
            <div>
              <h3>Operational safeguards</h3>
              <p>Important controls enforced by the BukzEx administration services.</p>
            </div>
          </div>

          <div className="admin-settings-safeguards">
            <div>
              <ShieldCheck size={17} />
              <span><strong>Wallet adjustments are idempotent.</strong> Each credit or debit uses a unique request reference so a retry cannot apply the same adjustment twice.</span>
            </div>
            <div>
              <ShieldCheck size={17} />
              <span><strong>Supplier cancellation is confirmed first.</strong> BukzEx does not refund a ShadexGoLtd order until the supplier confirms its cancellation and refund.</span>
            </div>
            <div>
              <ShieldCheck size={17} />
              <span><strong>Paid and fulfilled orders are protected.</strong> Permanent deletion is restricted to unpaid or failed order records.</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
