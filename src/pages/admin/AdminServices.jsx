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
  { id: "marketplace", name: "Marketplace", endpoint: "marketplace", summary: "Netflix, Spotify and other digital plans" },
  { id: "sms", name: "Virtual SMS / OTP", endpoint: "sms", summary: "Virtual phone number services" },
  { id: "social", name: "Social Media Boost", endpoint: "social", summary: "Social growth packages" },
];

function priceInMajor(price) {
  if (price?.amount_minor == null) return "";
  return String(Number(price.amount_minor) / (10 ** Number(price.minor_unit ?? 2)));
}

function priceOf(item) {
  if (item?.price && item.price.amount_minor != null) return item.price;
  if (item?.amount_minor != null) {
    return { amount_minor: item.amount_minor, currency: item.currency, minor_unit: item.minor_unit };
  }
  return null;
}

function editableItems(serviceId, data) {
  if (!data) return [];
  if (serviceId === "vtu") {
    const dataSection = data.data || {};
    const networkById = new Map([
      ...(dataSection.networks || []),
      ...(data.airtime?.networks || []),
    ].map((network) => [String(network.id), network]));
    const flatPlans = Array.isArray(dataSection.plans) ? dataSection.plans : [];
    if (flatPlans.length) {
      return flatPlans.map((plan) => {
        const network = networkById.get(String(plan.network_id));
        return {
          id: String(plan.id),
          title: `${network?.name || plan.network_name || plan.network_code || "Data"} — ${plan.name || plan.plan_name || "Plan"}`,
          price: priceOf(plan),
        };
      }).filter((item) => item.price);
    }
    const rows = dataSection.networks || [];
    if (rows.some((row) => !Array.isArray(row.plans) && (row.network_id || row.price || row.amount_minor != null))) {
      return rows.map((plan) => {
        const network = networkById.get(String(plan.network_id));
        return {
          id: String(plan.id),
          title: `${network?.name || plan.network_name || plan.network_code || "Data"} — ${plan.name || plan.plan_name || "Plan"}`,
          price: priceOf(plan),
        };
      }).filter((item) => item.price);
    }
    return rows.flatMap((network) => (network.plans || []).map((plan) => ({
      id: String(plan.id), title: `${network.name} — ${plan.name}`, price: priceOf(plan),
    })).filter((item) => item.price));
  }
  if (serviceId === "bills") {
    return [
      ...(data.electricity?.providers || []),
      ...(data.cable?.providers || []),
    ].flatMap((provider) => [
      ...((provider.plans || [])
        .filter((plan) => !plan.variable_amount && priceOf(plan))
        .map((plan) => ({ id: String(plan.id), title: `${provider.name} — ${plan.name}`, price: priceOf(plan) }))),
      {
        id: `fee-${String(provider.id)}`,
        title: `${provider.name} — BukzEx service fee`,
        price: {
          amount_minor: Number(provider.service_fee_minor ?? 0),
          currency: data.market?.currency || "NGN",
          minor_unit: Number(data.market?.minorUnit ?? 2),
        },
      },
    ]);
  }
  if (serviceId === "marketplace") {
    return (data.products || []).map((product) => ({
      id: String(product.id), title: product.title || product.name || "Digital service", price: priceOf(product),
    })).filter((item) => item.price);
  }
  if (serviceId === "sms") {
    return (data.services || []).map((service) => ({
      id: String(service.id), title: `${service.service_name} — ${service.country_name}`, price: priceOf(service),
    })).filter((item) => item.price);
  }
  if (serviceId === "social") {
    return (data.services || []).map((service) => ({
      id: String(service.package_id), title: `${service.platform} — ${service.service_name}`, price: priceOf(service),
    })).filter((item) => item.price);
  }
  return [];
}

function countItems(id, data) {
  if (!data) return 0;
  return editableItems(id, data).length;
}

export default function AdminServices() {
  const [catalogues, setCatalogues] = useState({});
  const [enabled, setEnabled] = useState({});
  const [markup, setMarkup] = useState({});
  const [itemPrices, setItemPrices] = useState({});
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
        // Marketplace is intentionally available by default, per the owner's request.
        nextEnabled[item.id] = item.id === "marketplace" || row?.status === "active";
        nextMarkup[item.id] = String(row?.price_markup_percent ?? 0);
      }
      setEnabled(nextEnabled);

      const results = await Promise.all(MANAGED.map(async (item) => {
        try {
          const data = await getShadexCatalogue(item.endpoint);
          return [item.id, { data, error: "" }];
        } catch (err) {
          return [item.id, { data: null, error: err?.message || "Catalogue unavailable" }];
        }
      }));
      const nextCatalogues = Object.fromEntries(results);
      setCatalogues(nextCatalogues);

      const nextPrices = {};
      for (const item of MANAGED) {
        const overrides = byId[item.id]?.bukzex_prices || {};
        for (const row of editableItems(item.id, nextCatalogues[item.id]?.data)) {
          const saved = overrides[row.id];
          nextPrices[`${item.id}:${row.id}`] = {
            amount: saved?.amount_minor != null ? priceInMajor(saved) : priceInMajor(row.price),
            enabled: saved?.is_active !== false,
          };
        }
      }
      setItemPrices(nextPrices);
      setMarkup(nextMarkup);
    } catch (err) {
      setError(err?.message || "Unable to load service settings. Check that you are signed in as an admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadServices(); }, []);

  const canEnable = useMemo(() => Object.fromEntries(MANAGED.map((item) => {
    const result = catalogues[item.id];
    return [item.id, Boolean(result?.data && (item.id === "marketplace" || countItems(item.id, result.data) > 0))];
  })), [catalogues]);

  async function verifyAdmin() {
    const user = auth.currentUser;
    if (!user) throw new Error("Sign in again as an administrator, then try saving.");
    const adminSnap = await getDoc(doc(db, "admins", user.uid));
    if (!adminSnap.exists()) throw new Error("Administrator access required.");
    return user;
  }

  async function save(item) {
    setError("");
    setNotice("");
    if (enabled[item.id] && !canEnable[item.id]) {
      setError(`${item.name} cannot be enabled because its ShadexGoLtd catalogue is empty or unavailable.`);
      return;
    }
    const rawMarkup = Number(markup[item.id] ?? 0);
    if (!Number.isFinite(rawMarkup) || rawMarkup < 0 || rawMarkup > 1000) {
      setError("Markup must be between 0% and 1000%.");
      return;
    }
    setSaving(item.id);
    try {
      await verifyAdmin();
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

  async function saveItemPrices(item) {
    setError("");
    setNotice("");
    const rows = editableItems(item.id, catalogues[item.id]?.data);
    const nextOverrides = {};
    for (const row of rows) {
      const key = `${item.id}:${row.id}`;
      const entry = itemPrices[key];
      if (!entry?.amount?.trim()) continue;
      const unit = Number(row.price?.minor_unit ?? 2);
      const amount = Number(entry.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError(`Enter a valid BukzEx price for ${row.title}.`);
        return;
      }
      nextOverrides[row.id] = {
        item_id: row.id,
        item_name: row.title,
        amount_minor: Math.round(amount * (10 ** unit)),
        currency: String(row.price?.currency || "NGN"),
        minor_unit: unit,
        is_active: Boolean(entry.enabled),
      };
    }
    if (!Object.keys(nextOverrides).length) {
      setError(`No fixed-price items are available to save for ${item.name}.`);
      return;
    }

    setSaving(`${item.id}_prices`);
    try {
      await verifyAdmin();
      const serviceRef = doc(db, "services", item.id);
      const current = await getDoc(serviceRef);
      const currentData = current.exists() ? current.data() : {};
      await setDoc(serviceRef, {
        service_key: item.id,
        name: item.name,
        provider: "ShadexGoLtd",
        status: enabled[item.id] ? "active" : "paused",
        bukzex_prices: { ...(currentData.bukzex_prices || {}), ...nextOverrides },
        updated_at: serverTimestamp(),
      }, { merge: true });
      setNotice(`${Object.keys(nextOverrides).length} ${item.name} item prices saved.`);
    } catch (err) {
      setError(err?.message || `${item.name} prices could not be saved.`);
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
          <p>Set a BukzEx selling price for each ShadexGoLtd plan or package.</p>
        </div>
        <button type="button" className="admin-services-refresh" onClick={loadServices} disabled={loading}>
          <RefreshCw size={17} /> Refresh catalogues
        </button>
      </div>

      <div className="admin-shadex-note">Each saved BukzEx price is separate from ShadexGoLtd’s source price.</div>
      {error && <div className="admin-services-error" role="alert">{error}</div>}
      {notice && <div className="admin-shadex-success" role="status"><CheckCircle2 size={17} />{notice}</div>}

      {loading ? <div className="admin-services-loading">Loading ShadexGoLtd catalogues…</div> : (
        <div className="admin-shadex-grid">
          {MANAGED.map((item) => {
            const result = catalogues[item.id];
            const total = countItems(item.id, result?.data);
            const rows = editableItems(item.id, result?.data);
            const isSaving = saving === item.id;
            const supportsMarkup = item.id === "vtu" || item.id === "bills";
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
                  <p className="admin-shadex-count">{total} catalogue {total === 1 ? "item" : "items"} loaded</p>
                )}
                <label className="admin-shadex-toggle">
                  <input type="checkbox" checked={Boolean(enabled[item.id])} disabled={!canEnable[item.id]} onChange={(event) => setEnabled((old) => ({ ...old, [item.id]: event.target.checked }))} />
                  <span>Show this service to customers</span>
                </label>

                {rows.length > 0 && (
                  <div className="admin-marketplace-editor">
                    <h4>Set a BukzEx price for each plan or package</h4>
                    <div className="admin-marketplace-list">
                      {rows.map((row) => {
                        const key = `${item.id}:${row.id}`;
                        const value = itemPrices[key] || { amount: priceInMajor(row.price), enabled: true };
                        return (
                          <div className="admin-marketplace-row" key={key}>
                            <div className="admin-marketplace-name">
                              <strong>{row.title}</strong>
                              <small>ShadexGoLtd: {row.price?.currency || "NGN"} {priceInMajor(row.price)}</small>
                            </div>
                            <label className="admin-marketplace-price">
                              BukzEx price
                              <input type="number" min="0.01" step="0.01" value={value.amount} onChange={(event) => setItemPrices((old) => ({ ...old, [key]: { ...value, amount: event.target.value } }))} />
                            </label>
                            <label className="admin-marketplace-publish">
                              <input type="checkbox" checked={Boolean(value.enabled)} onChange={(event) => setItemPrices((old) => ({ ...old, [key]: { ...value, enabled: event.target.checked } }))} />
                              Show item
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    <button className="admin-shadex-save" type="button" onClick={() => saveItemPrices(item)} disabled={saving === `${item.id}_prices` || loading}>
                      {saving === `${item.id}_prices` ? <LoaderCircle size={16} className="service-spinner" /> : <Save size={16} />}
                      {saving === `${item.id}_prices` ? "Saving prices…" : `Save ${item.name} prices`}
                    </button>
                  </div>
                )}

                {supportsMarkup && (
                  <label className="admin-shadex-markup">
                    BukzEx markup (%) for variable-amount orders
                    <input type="number" min="0" max="1000" step="0.1" value={markup[item.id] ?? "0"} onChange={(event) => setMarkup((old) => ({ ...old, [item.id]: event.target.value }))} />
                  </label>
                )}
                {item.id === "bills" && <small className="admin-shadex-count">Variable-amount bill plans use the markup above; fixed plans have individual prices.</small>}
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
