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

function priceInMajor(price) {
  if (price?.amount_minor == null) return "";
  return String(Number(price.amount_minor) / (10 ** Number(price.minor_unit ?? 2)));
}

export default function AdminServices() {
  const [catalogues, setCatalogues] = useState({});
  const [enabled, setEnabled] = useState({});
  const [markup, setMarkup] = useState({});
  const [itemPrices, setItemPrices] = useState({});
  const [marketplaceOverrides, setMarketplaceOverrides] = useState({});
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
        // The owner explicitly wants BukzEx Marketplace available by default.
        // Saving Marketplace settings publishes this choice to customer pages.
        nextEnabled[item.id] = item.id === "marketplace" || row?.status === "active";
        nextMarkup[item.id] = String(row?.price_markup_percent ?? 0);
      }
      setEnabled(nextEnabled);
      setMarkup(nextMarkup);
      const savedOverrides = byId.marketplace?.bukzex_prices || {};
      setMarketplaceOverrides(savedOverrides);

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
      const products = nextCatalogues.marketplace?.data?.products || [];
      setItemPrices(Object.fromEntries(products.map((product) => {
        const saved = savedOverrides[String(product.id)];
        return [String(product.id), {
          amount: saved?.amount_minor != null ? priceInMajor(saved) : priceInMajor(product.price),
          enabled: saved?.is_active !== false,
        }];
      })));
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

  async function saveMarketplacePrices() {
    setError("");
    setNotice("");
    const user = auth.currentUser;
    if (!user) {
      setError("Sign in again as an administrator, then try saving.");
      return;
    }
    const products = catalogues.marketplace?.data?.products || [];
    const nextOverrides = { ...marketplaceOverrides };
    let savedCount = 0;
    for (const product of products) {
      const id = String(product.id);
      const entry = itemPrices[id];
      if (!entry?.amount?.trim()) continue;
      const unit = Number(product.price?.minor_unit ?? 2);
      const amount = Number(entry.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError(`Enter a valid BukzEx price for ${product.title || product.name || "the selected plan"}.`);
        return;
      }
      nextOverrides[id] = {
        item_id: id,
        item_name: String(product.title || product.name || "Digital service"),
        amount_minor: Math.round(amount * (10 ** unit)),
        currency: String(product.price?.currency || catalogues.marketplace?.data?.market?.currency || "NGN"),
        minor_unit: unit,
        is_active: Boolean(entry.enabled),
      };
      savedCount += 1;
    }
    if (!savedCount) {
      setError("Enter a BukzEx price for at least one Marketplace plan.");
      return;
    }
    setSaving("marketplace_prices");
    try {
      const adminSnap = await getDoc(doc(db, "admins", user.uid));
      if (!adminSnap.exists()) throw new Error("Administrator access required.");
      const serviceRef = doc(db, "services", "marketplace");
      const current = await getDoc(serviceRef);
      const currentData = current.exists() ? current.data() : {};
      const saved = { ...(currentData.bukzex_prices || {}), ...nextOverrides };
      await setDoc(serviceRef, {
        service_key: "marketplace",
        name: "Marketplace",
        provider: "ShadexGoLtd",
        status: enabled.marketplace ? "active" : "paused",
        bukzex_prices: saved,
        updated_at: serverTimestamp(),
      }, { merge: true });
      setMarketplaceOverrides(saved);
      setNotice(`${savedCount} Marketplace price${savedCount === 1 ? "" : "s"} saved.`);
    } catch (err) {
      setError(err?.message || "Marketplace prices could not be saved.");
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
            const products = item.id === "marketplace" ? (result?.data?.products || []) : [];
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
                {item.id === "marketplace" ? (
                  <div className="admin-marketplace-editor">
                    <h4>Set a BukzEx price for each plan</h4>
                    {products.length === 0 ? (
                      <p className="admin-marketplace-empty">No digital-service plans were returned by ShadexGoLtd yet.</p>
                    ) : (
                      <>
                        <div className="admin-marketplace-list">
                          {products.map((product) => {
                            const id = String(product.id);
                            const value = itemPrices[id] || { amount: priceInMajor(product.price), enabled: true };
                            return (
                              <div className="admin-marketplace-row" key={id}>
                                <div className="admin-marketplace-name">
                                  <strong>{product.title || product.name}</strong>
                                  <small>ShadexGoLtd: {product.price?.currency || "NGN"} {priceInMajor(product.price)}</small>
                                </div>
                                <label className="admin-marketplace-price">
                                  BukzEx price
                                  <input type="number" min="0.01" step="0.01" value={value.amount} onChange={(event) => setItemPrices((old) => ({ ...old, [id]: { ...value, amount: event.target.value } }))} />
                                </label>
                                <label className="admin-marketplace-publish">
                                  <input type="checkbox" checked={Boolean(value.enabled)} onChange={(event) => setItemPrices((old) => ({ ...old, [id]: { ...value, enabled: event.target.checked } }))} />
                                  Show plan
                                </label>
                              </div>
                            );
                          })}
                        </div>
                        <button className="admin-shadex-save" type="button" onClick={saveMarketplacePrices} disabled={saving === "marketplace_prices" || loading}>
                          {saving === "marketplace_prices" ? <LoaderCircle size={16} className="service-spinner" /> : <Save size={16} />}
                          {saving === "marketplace_prices" ? "Saving prices…" : "Save Marketplace prices"}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <label className="admin-shadex-markup">
                    BukzEx markup (%)
                    <input type="number" min="0" max="1000" step="0.1" value={markup[item.id] ?? "0"} onChange={(event) => setMarkup((old) => ({ ...old, [item.id]: event.target.value }))} />
                  </label>
                )}
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
