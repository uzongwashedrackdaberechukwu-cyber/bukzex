import { useEffect, useMemo, useState } from "react";
import {
  Bitcoin,
  Eye,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { getCryptoAdminRoutes } from "../../services/api";
import "./AdminCrypto.css";

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusLabel(value) {
  return String(value || "unknown").replaceAll("_", " ");
}

function statusClass(value) {
  const status = String(value || "").toLowerCase();
  if (["confirmed", "paid", "completed"].includes(status)) return "success";
  if (status.includes("reject") || status.includes("fail")) return "danger";
  if (status === "pending" || status === "submitting" || status === "processing") return "pending";
  return "neutral";
}

function requestAmount(request) {
  if (request.kind === "deposit") {
    return `$${Number(request.amount_usd || 0).toFixed(2)} USD`;
  }
  return `₦${(Number(request.amount_minor || 0) / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminCrypto() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [routes, setRoutes] = useState([]);
  const [markupValues, setMarkupValues] = useState({});
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingSaving, setPricingSaving] = useState("");
  const [pricingError, setPricingError] = useState("");
  const [pricingMessage, setPricingMessage] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const result = await getDocs(query(
        collection(db, "crypto_requests"),
        orderBy("created_at", "desc"),
        limit(100),
      ));
      setRequests(result.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (err) {
      setError(err?.message || "Unable to load crypto requests. Check admin access and Firestore rules.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPricing() {
    setPricingLoading(true);
    setPricingError("");
    setPricingMessage("");
    try {
      const [routeRows, priceSnapshot] = await Promise.all([
        getCryptoAdminRoutes(),
        getDocs(collection(db, "crypto_route_pricing")),
      ]);
      const saved = {};
      priceSnapshot.docs.forEach((item) => {
        saved[item.id] = Number(item.data().markup_percent ?? 0);
      });
      setRoutes(routeRows);
      setMarkupValues(saved);
    } catch (err) {
      setPricingError(err?.message || "Could not load crypto rates and markup settings.");
    } finally {
      setPricingLoading(false);
    }
  }

  async function saveMarkup(route) {
    const markup = Number(markupValues[route.id]);
    if (!Number.isFinite(markup) || markup < 0) {
      setPricingError("Enter a valid markup percentage of zero or more.");
      return;
    }
    setPricingSaving(route.id);
    setPricingError("");
    setPricingMessage("");
    try {
      await setDoc(doc(db, "crypto_route_pricing", route.id), {
        markup_percent: markup,
        updated_at: serverTimestamp(),
      });
      setPricingMessage("BukzEx markup saved.");
    } catch (err) {
      setPricingError(err?.message || "Could not save this markup. Check admin access and Firestore rules.");
    } finally {
      setPricingSaving("");
    }
  }

  useEffect(() => {
    loadRequests();
    loadPricing();
  }, []);

  const visibleRequests = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return requests.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      const matchesFilter = filter === "all"
        || (filter === "pending" && ["pending", "submitting", "processing"].includes(status))
        || (filter === "confirmed" && ["confirmed", "paid", "completed"].includes(status))
        || (filter === "rejected" && (status.includes("reject") || status.includes("fail")));
      const haystack = [
        item.id, item.user_id, item.kind, item.status, item.asset_code,
        item.network_name, item.transaction_hash, item.shadex_request_id,
        item.bank_name, item.account_name,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesFilter && (!needle || haystack.includes(needle));
    });
  }, [requests, search, filter]);

  const pendingCount = requests.filter((item) =>
    ["pending", "submitting", "processing"].includes(String(item.status || "").toLowerCase())
  ).length;
  const completedCount = requests.filter((item) =>
    ["confirmed", "paid", "completed"].includes(String(item.status || "").toLowerCase())
  ).length;

  return (
    <section className="admin-crypto">
      <div className="admin-crypto-header">
        <div>
          <span className="admin-section-kicker">WALLET OPERATIONS</span>
          <h2>Crypto requests</h2>
          <p>Review deposits and withdrawals. Request outcomes are updated by ShadexGoLtd webhooks.</p>
        </div>
        <button type="button" className="admin-crypto-refresh" onClick={loadRequests} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spinning" : ""} />
          Refresh
        </button>
      </div>

      <section className="admin-crypto-pricing">
        <div className="admin-crypto-pricing-heading">
          <div>
            <span className="admin-section-kicker">BUKZEX PRICING</span>
            <h3>Crypto route markups</h3>
            <p>See the base rate and set the markup used to calculate BukzEx’s customer rate.</p>
          </div>
          <button type="button" onClick={loadPricing} disabled={pricingLoading}>
            Refresh rates
          </button>
        </div>
        {pricingError && <p className="admin-crypto-error" role="alert">{pricingError}</p>}
        {pricingMessage && <p className="admin-crypto-pricing-success" role="status">{pricingMessage}</p>}
        {pricingLoading ? (
          <div className="admin-crypto-empty">Loading crypto rates…</div>
        ) : routes.length === 0 ? (
          <div className="admin-crypto-empty">No crypto routes are available.</div>
        ) : (
          <div className="admin-crypto-pricing-list">
            {routes.map((route) => {
              const baseRate = Number(route.rate_ngn_per_usd || 0);
              const markup = Number(markupValues[route.id] ?? 0);
              const customerRate = baseRate * (1 + markup / 100);
              const formatRate = (value) => `₦${value.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
              return (
                <article className="admin-crypto-pricing-row" key={route.id}>
                  <div className="admin-crypto-pricing-route">
                    <strong>{route.asset_name} {route.asset_code} · {route.network_name}</strong>
                    <small>{route.network_code}</small>
                    <span>Base rate: {formatRate(baseRate)} / USD</span>
                    <b>BukzEx rate: {formatRate(customerRate)} / USD</b>
                  </div>
                  <label>
                    Markup (%)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={markupValues[route.id] ?? "0"}
                      onChange={(event) => setMarkupValues((current) => ({
                        ...current,
                        [route.id]: event.target.value,
                      }))}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => saveMarkup(route)}
                    disabled={pricingSaving === route.id}
                  >
                    {pricingSaving === route.id ? "Saving…" : "Save markup"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="admin-crypto-stats">
        <article><span>Recent requests</span><strong>{requests.length}</strong></article>
        <article><span>Awaiting outcome</span><strong>{pendingCount}</strong></article>
        <article><span>Confirmed or paid</span><strong>{completedCount}</strong></article>
      </div>

      {error && <p className="admin-crypto-error" role="alert">{error}</p>}

      <div className="admin-crypto-toolbar">
        <label className="admin-crypto-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer, reference, hash or bank"
          />
        </label>
        <div className="admin-crypto-filters" aria-label="Filter crypto requests">
          {[
            ["all", "All"],
            ["pending", "Pending"],
            ["confirmed", "Confirmed / paid"],
            ["rejected", "Rejected / failed"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-crypto-list">
        {loading ? (
          <div className="admin-crypto-empty">Loading crypto requests…</div>
        ) : visibleRequests.length === 0 ? (
          <div className="admin-crypto-empty">
            <Bitcoin size={24} />
            <strong>No crypto requests found</strong>
            <span>New deposit and withdrawal requests will appear here.</span>
          </div>
        ) : visibleRequests.map((item) => (
          <article className="admin-crypto-request" key={item.id}>
            <div className="admin-crypto-request-top">
              <div className="admin-crypto-kind">
                <span className="admin-crypto-icon"><Bitcoin size={17} /></span>
                <div>
                  <strong>{item.kind === "deposit" ? "Crypto deposit" : "Bank withdrawal"}</strong>
                  <small>{formatDate(item.created_at)}</small>
                </div>
              </div>
              <span className={`admin-crypto-status ${statusClass(item.status)}`}>
                {statusLabel(item.status)}
              </span>
            </div>
            <div className="admin-crypto-request-meta">
              <div><small>Amount</small><strong>{requestAmount(item)}</strong></div>
              <div><small>Customer ID</small><strong>{item.user_id || "—"}</strong></div>
              <div><small>Shadex reference</small><strong>{item.shadex_request_id || "Awaiting submission"}</strong></div>
            </div>
            <button type="button" className="admin-crypto-view" onClick={() => setSelected(item)}>
              <Eye size={15} /> View request
            </button>
          </article>
        ))}
      </div>

      {selected && (
        <div className="admin-crypto-overlay" onClick={() => setSelected(null)}>
          <section
            className="admin-crypto-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-crypto-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="admin-section-kicker">REQUEST DETAILS</span>
                <h3 id="admin-crypto-modal-title">{selected.kind === "deposit" ? "Crypto deposit" : "Bank withdrawal"}</h3>
              </div>
              <button type="button" aria-label="Close request details" onClick={() => setSelected(null)}><X size={18} /></button>
            </header>
            <div className="admin-crypto-details">
              <div><span>Status</span><strong className={`admin-crypto-status ${statusClass(selected.status)}`}>{statusLabel(selected.status)}</strong></div>
              <div><span>Amount</span><strong>{requestAmount(selected)}</strong></div>
              <div><span>Customer ID</span><strong>{selected.user_id || "—"}</strong></div>
              <div><span>Created</span><strong>{formatDate(selected.created_at)}</strong></div>
              <div><span>Updated</span><strong>{formatDate(selected.updated_at)}</strong></div>
              <div><span>Shadex request ID</span><strong>{selected.shadex_request_id || "—"}</strong></div>
              {selected.kind === "deposit" && <>
                {selected.credited_amount_minor != null && <>
                  <div><span>Base credit</span><strong>₦{(Number(selected.provider_credit_minor || 0) / 100).toFixed(2)}</strong></div>
                  <div><span>BukzEx markup</span><strong>{Number(selected.markup_percent || 0).toFixed(2)}% · ₦{(Number(selected.markup_credit_minor || 0) / 100).toFixed(2)}</strong></div>
                  <div><span>Customer credited</span><strong>₦{(Number(selected.credited_amount_minor || 0) / 100).toFixed(2)}</strong></div>
                  <div><span>Base rate</span><strong>₦{Number(selected.quoted_rate_ngn_per_usd || 0).toFixed(2)} / USD</strong></div>
                  <div><span>BukzEx rate</span><strong>₦{Number(selected.bukzex_rate_ngn_per_usd || 0).toFixed(2)} / USD</strong></div>
                </>}
                <div><span>Route ID</span><strong>{selected.route_id || "—"}</strong></div>
                <div className="full"><span>Transaction hash</span><strong>{selected.transaction_hash || "—"}</strong></div>
              </>}
              {selected.kind === "withdrawal" && <>
                <div><span>Bank</span><strong>{selected.bank_name || "—"}</strong></div>
                <div><span>Account name</span><strong>{selected.account_name || "—"}</strong></div>
                <div><span>Account number</span><strong>{selected.account_number || "—"}</strong></div>
              </>}
              {selected.admin_note && <div className="full"><span>Processing note</span><strong>{selected.admin_note}</strong></div>}
            </div>
            <p className="admin-crypto-note">This screen is for review. ShadexGoLtd webhooks update request status and wallet balances.</p>
          </section>
        </div>
      )}
    </section>
  );
}
