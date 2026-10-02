import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { getShadexCatalogue } from "../services/shadexCatalog";
import "./ShadexCataloguePanel.css";

function customerPrice(id, overrides) {
  const saved = overrides[String(id)];
  if (!saved || saved.is_active === false || saved.amount_minor == null) return null;
  return saved;
}

function money(price) {
  if (price?.amount_minor == null) return "Price varies";
  const value = Number(price.amount_minor) / (10 ** Number(price.minor_unit ?? 2));
  if (!Number.isFinite(value)) return "Price varies";
  return `${price.currency || "NGN"} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function expandableList(title, rows, renderRow) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <p className="shadex-empty">No {title.toLowerCase()} are currently available.</p>;
  }
  return (
    <section className="shadex-catalogue-group">
      <h3>{title} ({rows.length})</h3>
      <div className="shadex-catalogue-list">{rows.map(renderRow)}</div>
    </section>
  );
}

function NestedPlans({ rows, label, overrides }) {
  const visible = (rows || []).map((provider) => {
    const fee = customerPrice(`fee-${provider.id}`, overrides);
    const plans = (provider.plans || []).map((plan) => ({
      ...plan,
      customer_price: plan.variable_amount ? null : customerPrice(plan.id, overrides),
    })).filter((plan) => plan.customer_price);
    return { ...provider, customer_fee: fee, visible_plans: plans };
  }).filter((provider) => provider.visible_plans.length || provider.customer_fee);

  return expandableList(label, visible, (provider) => (
    <details className="shadex-catalogue-item" key={provider.id}>
      <summary>{provider.name || provider.title || provider.identifier}</summary>
      <div className="shadex-catalogue-sublist">
        {provider.customer_fee && <div className="shadex-catalogue-line"><span>BukzEx service fee</span><strong>{money(provider.customer_fee)}</strong></div>}
        {provider.visible_plans.map((plan) => (
          <div className="shadex-catalogue-line" key={plan.id}>
            <span>{plan.name}</span>
            <strong>{plan.variable_amount ? "Variable amount" : money(plan.customer_price)}</strong>
          </div>
        ))}
      </div>
    </details>
  ));
}

export default function ShadexCataloguePanel({ serviceId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    getShadexCatalogue(serviceId)
      .then((result) => { if (live) setData(result); })
      .catch((err) => { if (live) setError(err?.message || "Catalogue is temporarily unavailable."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [serviceId]);

  useEffect(() => {
    let live = true;
    getDoc(doc(db, "services", serviceId))
      .then((snapshot) => {
        if (live && snapshot.exists()) {
          setOverrides(snapshot.data().bukzex_prices || {});
        }
      })
      .catch(() => {});
    return () => { live = false; };
  }, [serviceId]);

  if (loading) return <div className="shadex-catalogue-status"><LoaderCircle size={17} className="service-spinner" /> Loading live catalogue…</div>;
  if (error) return <div className="shadex-catalogue-status error"><AlertCircle size={17} /> ShadexGoLtd catalogue is temporarily unavailable: {error}</div>;
  if (!data) return null;

  const currency = data.market?.currency || "NGN";
  return (
    <section className="shadex-catalogue-panel">
      <div className="shadex-catalogue-heading">
        <span>LIVE FROM SHADEXGOLTD</span>
        <small>{currency} · {data.market?.countryCode || ""}</small>
      </div>

      {serviceId === "bills" && <>
        <NestedPlans rows={data.electricity?.providers} label="Electricity providers" overrides={overrides} />
        <NestedPlans rows={data.cable?.providers} label="Cable TV providers" overrides={overrides} />
      </>}

      {serviceId === "marketplace" && (() => {
        const products = (data.products || []).map((item) => ({
          ...item,
          customer_price: customerPrice(item.id, overrides),
        })).filter((item) => item.customer_price);
        return expandableList("Netflix, Spotify & other digital plans", products, (product) => (
          <div className="shadex-catalogue-item" key={product.id}>
            <strong>{product.title || product.name || "Digital service"}</strong>
            <span>{money(product.customer_price)}</span>
          </div>
        ));
      })()}

      {serviceId === "sms" && (() => {
        const services = (data.services || []).map((item) => ({
          ...item,
          customer_price: customerPrice(item.id, overrides),
        })).filter((item) => item.customer_price);
        return expandableList("OTP services", services, (item) => (
          <div className="shadex-catalogue-item" key={item.id}>
            <strong>{item.service_name}</strong><span>{item.country_name} · {money(item.customer_price)}</span>
          </div>
        ));
      })()}

      {serviceId === "social" && (() => {
        const services = (data.services || []).map((item) => ({
          ...item,
          customer_price: customerPrice(item.package_id, overrides),
        })).filter((item) => item.customer_price);
        return expandableList("Social Boost packages", services, (item) => (
          <div className="shadex-catalogue-item" key={item.package_id}>
            <strong>{item.service_name}</strong><span>{item.platform} · {Number(item.quantity).toLocaleString()} · {money(item.customer_price)}</span>
          </div>
        ));
      })()}

      {serviceId === "vtu" && (() => {
        const networks = data.data?.networks || [];
        const plans = networks.flatMap((network) => (network.plans || []).map((plan) => ({
          ...plan,
          network_name: network.name,
          customer_price: customerPrice(plan.id, overrides),
        }))).filter((plan) => plan.customer_price);
        return expandableList("Data plans", plans, (plan) => (
          <div className="shadex-catalogue-item" key={plan.id}>
            <strong>{plan.network_name} — {plan.name}</strong><span>{money(plan.customer_price)}</span>
          </div>
        ));
      })()}
    </section>
  );
}
