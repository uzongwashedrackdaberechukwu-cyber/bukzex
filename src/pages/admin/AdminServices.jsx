import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { getShadexCatalogue } from "../../services/shadexCatalog";
import { getServices } from "../../services/api";
import { CheckCircle2, LoaderCircle, RefreshCw, Save, XCircle } from "lucide-react";
import "./AdminServices.css";
import "./AdminShadexServices.css";

const MANAGED = [
  { id: "vtu", name: "Airtime & Data", endpoint: "vtu", summary: "Mobile airtime and data plans" },
  { id: "bills", name: "Electricity & Cable TV", endpoint: "bills", summary: "Electricity and cable bill plans" },
  { id: "marketplace", name: "Marketplace", endpoint: "marketplace", summary: "ShadexGoLtd marketplace products" },
  { id: "sms", name: "Virtual SMS / OTP", endpoint: "sms", summary: "Virtual phone number services" },
  { id: "social", name: "Social Media Boost", endpoint: "social", summary: "Social growth packages" },
];

function countItems(id, data) {
  if (!data) return 0;
  if (id === "vtu") return (data.airtime?.networks || []).length + (data.data?.networks || []).length;
  if (id === "bills") return (data.electricity?.providers || []).length + (data.cable?.providers || []).length;
  return (data.products || data.services || []).length;
}

export default function AdminServices() {
  const [catalogues, setCatalogues] = useState({});
  const [enabled, setEnabled] = useState({});
  const [markup, setMarkup] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadServices() {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const existing = await getServices();
      const byId = Object.fromEntries((existing.services || []).map((row) => [row.service_key || row.id, row]));
      const nextEnabled = {};
      const nextMarkup = {};
      for (const item of MANAGED) {
        const row = byId[item.id];
        nextEnabled[item.id] = row?.status === "active";
        nextMarkup[item.id] = String(row?.price_markup_percent ?? 0);
      }
      setEnabled(nextEnabled);
      setMarkup(nextMarkup);

      const results = await Promise.all(MANAGED.map(async (item) => {
        try {
          const data = await getShadexCatalogue(item.endpoint);
          return [item.id, { data, error: "" }];
        } catch (err) {
          return [item.id, { data: null, error: err?.message || "Catalogue unavailable" }];
        }
      }));
      setCatalogues(Object.fromEntries(results));
    } catch (err) {
      setError(err?.message || "Unable to load service settings. Check that you are signed in as an admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadServices(); }, []);

  const canEnable = useMemo(() => Object.fromEntries(MANAGED.map((item) => {
    const result = catalogues[item.id];
    return [item.id, Boolean(result?.data && countItems(item.id, result.data) > 0)];
  })), [catalogues]);

  async function save(item) {
    setError("");
    setNotice("");
    const user = auth.currentUser;
    if (!user) {
      setError("Sign in again as an administrator, then try saving.");
      return;
    }
    const rawMarkup = Number(markup[item.id] ?? 0);
    if (!Number.isFinite(rawMarkup) || rawMarkup < 0 || rawMarkup > 1000) {
      setError("Markup must be between 0% and 1000%.");
      return;
    }
    if (enabled[item.id] && !canEnable[item.id]) {
      setError(`${item.name} cannot be enabled because its ShadexGoLtd catalogue is empty or unavailable.`);
      return;
    }

    setSaving(item.id);
    try {
      const adminSnap = await getDoc(doc(db, "admins", user.uid));
      if (!adminSnap.exists()) throw new Error("Administrator access required.");
      await setDoc(doc(db, "services", item.id), {
        service_key: item.id,
        name: item.name,
        provider: "ShadexGoLtd",
        status: enabled[item.id] ? "active" : "paused",
        price_markup_percent: rawMarkup,
        updated_at: serverTimestamp(),
      }, { merge: true });
      setNotice(`${item.name} settings saved.`);
    } catch (err) {
      setError(err?.message || `Could not save ${item.name}.`);
    } finally {
      setSaving("");
    }
  }

  return (
    <section className="admin-services">
      <div className="admin-services-header">
        <div>
          <span className="admin-section-kicker">Service Management</span>
          <h2>Services & Pricing</h2>
          <p>Load ShadexGoLtd catalogues, choose what BukzEx offers, and set your markup.</p>
        </div>
        <button type="button" className="admin-services-refresh" onClick={loadServices} disabled={loading}>
          <RefreshCw size={17} /> Refresh catalogues
        </button>
      </div>

      <div className="admin-shadex-note">
        The markup is added to the provider price shown to customers. It does not change ShadexGoLtd’s source price.
      </div>
      {error && <div className="admin-services-error" role="alert">{error}</div>}
      {notice && <div className="admin-shadex-success" role="status"><CheckCircle2 size={17} />{notice}</div>}

      {loading ? <div className="admin-services-loading">Loading ShadexGoLtd catalogues…</div> : (
        <div className="admin-shadex-grid">
          {MANAGED.map((item) => {
            const result = catalogues[item.id];
            const total = countItems(item.id, result?.data);
            const isSaving = saving === item.id;
            return (
              <article className="admin-shadex-card" key={item.id}>
                <div className="admin-shadex-card-heading">
                  <div><h3>{item.name}</h3><p>{item.summary}</p></div>
                  <span className={`admin-service-status ${enabled[item.id] ? "available" : "unavailable"}`}>
                    {enabled[item.id] ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {enabled[item.id] ? "Published" : "Hidden"}
                  </span>
                </div>
                {result?.error ? <p className="admin-shadex-error">Catalogue unavailable: {result.error}</p> : (
                  <p className="admin-shadex-count">{total} catalogue {total === 1 ? "group" : "groups"} loaded</p>
                )}
                <label className="admin-shadex-toggle">
                  <input type="checkbox" checked={Boolean(enabled[item.id])} disabled={!canEnable[item.id]} onChange={(event) => setEnabled((old) => ({ ...old, [item.id]: event.target.checked }))} />
                  <span>Show this service to customers</span>
                </label>
                <label className="admin-shadex-markup">
                  BukzEx markup (%)
                  <input type="number" min="0" max="1000" step="0.1" value={markup[item.id] ?? "0"} onChange={(event) => setMarkup((old) => ({ ...old, [item.id]: event.target.value }))} />
                </label>
                <button className="admin-shadex-save" type="button" onClick={() => save(item)} disabled={isSaving || loading}>
                  {isSaving ? <LoaderCircle size={16} className="service-spinner" /> : <Save size={16} />}
                  {isSaving ? "Saving…" : "Save service settings"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
