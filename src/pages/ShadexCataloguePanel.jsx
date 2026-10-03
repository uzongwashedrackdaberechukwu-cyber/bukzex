import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { AlertCircle, CheckCircle2, Clock3, LoaderCircle } from "lucide-react";
import ServiceBrandMark from "../components/ServiceBrandMark";
import { getShadexCatalogue } from "../services/shadexCatalog";
import "./ShadexCataloguePanel.css";

function customerPrice(id, overrides) {
  const saved = overrides[String(id)];
  if (!saved || saved.is_active === false || saved.amount_minor == null || Number(saved.amount_minor) <= 0) return null;
  return saved;
}

function priceState(id, overrides) {
  const saved = overrides[String(id)];
  if (saved?.is_active === false) return "paused";
  if (saved?.amount_minor == null || Number(saved.amount_minor) <= 0) return "pending";
  return "ready";
}

function money(price) {
  if (price?.amount_minor == null) return "Price not set";
  const value = Number(price.amount_minor) / (10 ** Number(price.minor_unit ?? 2));
  if (!Number.isFinite(value)) return "Price not set";
  return `${price.currency || "NGN"} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function expandableList(title, rows, renderRow) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <div className="shadex-empty-state"><span className="shadex-empty-icon"><Clock3 size={19} /></span><div><strong>No options are available right now</strong><p>Check back later for new BukzEx services.</p></div></div>;
  }
  return (
    <section className="shadex-catalogue-group">
      <div className="shadex-catalogue-group-heading"><h3>{title}</h3><span>{rows.length} options</span></div>
      <div className="shadex-catalogue-list">{rows.map(renderRow)}</div>
    </section>
  );
}

function SelectableItem({ item, selectedId, onSelect, children, className = "", brandName = "", availability = "ready" }) {
  const active = selectedId === String(item.id);
  const disabled = availability !== "ready";
  return (
    <button
      type="button"
      className={`shadex-catalogue-item shadex-catalogue-selectable ${active ? "selected" : ""} ${disabled ? "disabled" : ""} ${className}`.trim()}
      aria-pressed={active}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => onSelect(item)}
      title={disabled ? (availability === "paused" ? "This option is currently unavailable" : "BukzEx is setting the price for this option") : "Select this option"}
    >
      <ServiceBrandMark name={brandName || item.name} logoUrl={item.logo_url} size="small" />
      <span className="shadex-catalogue-item-copy">{children}</span>
      {disabled ? <span className={`shadex-price-state ${availability}`}>{availability === "paused" ? "Unavailable" : "Price pending"}</span> : active && <CheckCircle2 size={19} aria-label="Selected" />}
    </button>
  );
}

function NestedPlans({ rows, label, overrides, selectedId, onSelect }) {
  const providers = (rows || []).map((provider) => {
    const fee = customerPrice(`fee-${provider.id}`, overrides);
    const plans = (provider.plans || []).map((plan) => ({
      ...plan,
      customer_price: plan.variable_amount ? null : customerPrice(plan.id, overrides),
      price_state: plan.variable_amount && fee ? "ready" : priceState(plan.id, overrides),
    }));
    return { ...provider, customer_fee: fee, visible_plans: plans };
  });

  return expandableList(label, providers, (provider) => (
    <details className="shadex-catalogue-provider" key={provider.id}>
      <summary><ServiceBrandMark name={provider.name || provider.title || provider.identifier} logoUrl={provider.logo_url} size="small" /><span>{provider.name || provider.title || provider.identifier}</span><span className="shadex-provider-count">{provider.visible_plans.length} options</span></summary>
      <div className="shadex-catalogue-sublist">
        {provider.customer_fee ? (
          <div className="shadex-catalogue-fee"><span>BukzEx service fee</span><strong>{money(provider.customer_fee)}</strong></div>
        ) : <div className="shadex-catalogue-fee pending"><span>BukzEx service fee</span><strong>Price pending</strong></div>}
        {provider.visible_plans.map((plan) => (
          <SelectableItem
            key={plan.id}
            item={{ id: plan.id, name: plan.name, logo_url: plan.logo_url || provider.logo_url, price: plan.customer_price, provider_id: provider.id, plan_type: plan.plan_type, variable_amount: plan.variable_amount === true }}
            selectedId={selectedId}
            onSelect={onSelect}
            className="shadex-catalogue-line-button"
            brandName={provider.name || provider.title || provider.identifier}
            availability={plan.price_state}
          >
            <strong>{plan.name}</strong><span>{plan.variable_amount ? "Enter amount · service fee applies" : money(plan.customer_price)}</span>
          </SelectableItem>
        ))}
      </div>
    </details>
  ));
}

export default function ShadexCataloguePanel({ serviceId, selectedId = "", onSelect = () => {} }) {
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
      .catch((err) => { if (live) setError(err?.message || "This catalogue is temporarily unavailable. Please try again shortly."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [serviceId]);

  useEffect(() => {
    let live = true;
    Promise.all([
      getDoc(doc(db, "services", serviceId)),
      getDocs(collection(db, "services", serviceId, "prices")),
    ])
      .then(([serviceSnapshot, pricesSnapshot]) => {
        if (!live) return;
        const legacy = serviceSnapshot.exists() ? serviceSnapshot.data().bukzex_prices || {} : {};
        const saved = Object.fromEntries(pricesSnapshot.docs.map((priceDoc) => {
          const price = priceDoc.data();
          return [String(price.item_id || decodeURIComponent(priceDoc.id)), price];
        }));
        setOverrides({ ...legacy, ...saved });
      })
      .catch(() => {});
    return () => { live = false; };
  }, [serviceId]);

  if (loading) return <div className="shadex-catalogue-status"><LoaderCircle size={18} className="service-spinner" /> Loading service options…</div>;
  if (error) return <div className="shadex-catalogue-status error"><AlertCircle size={18} /><span>{error}</span></div>;
  if (!data) return null;

  const currency = data.market?.currency || "NGN";
  return (
    <section className="shadex-catalogue-panel">
      <div className="shadex-catalogue-heading">
        <div><span className="shadex-catalogue-eyebrow">BUKZEX CATALOGUE</span><h2>Choose an option</h2></div>
        <small>{currency}{data.market?.countryCode ? ` · ${data.market.countryCode}` : ""}</small>
      </div>
      <p className="shadex-catalogue-intro">Available services appear here. Options marked “Price pending” cannot be purchased until BukzEx sets their price.</p>

      {serviceId === "bills" && <>
        <NestedPlans rows={data.electricity?.providers} label="Electricity" overrides={overrides} selectedId={selectedId} onSelect={onSelect} />
        <NestedPlans rows={data.cable?.providers} label="Cable TV" overrides={overrides} selectedId={selectedId} onSelect={onSelect} />
      </>}

      {serviceId === "marketplace" && (() => {
        const products = data.products || [];
        return expandableList("Digital subscriptions", products, (product) => {
          const state = priceState(product.id, overrides);
          const amount = customerPrice(product.id, overrides);
          return <SelectableItem key={product.id} item={{ id: product.id, name: product.title || product.name || "Digital service", logo_url: product.logo_url || product.image_url, price: amount, provider_product_id: product.provider_product_id, service_slug: product.service_slug }} selectedId={selectedId} onSelect={onSelect} availability={state} brandName={product.service_name || product.title || product.name}>
            <strong>{product.title || product.name || "Digital service"}</strong><span>{money(amount)}</span>
          </SelectableItem>;
        });
      })()}

      {serviceId === "email_verification" && (() => {
        const services = data.services || [];
        return expandableList("Email verification", services, (item) => {
          const amount = customerPrice(item.id, overrides);
          return <SelectableItem key={item.id} item={{ id: item.id, name: item.service_name, logo_url: item.logo_url, price: amount }} selectedId={selectedId} onSelect={onSelect} availability={priceState(item.id, overrides)} brandName={item.service_name}>
            <strong>{item.service_name}</strong><span>{money(amount)}</span>
          </SelectableItem>;
        });
      })()}

      {serviceId === "sms" && (() => {
        const services = data.services || [];
        return expandableList("Virtual SMS / OTP", services, (item) => {
          const amount = customerPrice(item.id, overrides);
          return <SelectableItem key={item.id} item={{ id: item.id, name: item.service_name, logo_url: item.logo_url, price: amount, country_code: item.country_code, country_name: item.country_name, provider_service_id: item.provider_service_id }} selectedId={selectedId} onSelect={onSelect} availability={priceState(item.id, overrides)} brandName={item.service_name}>
            <strong>{item.service_name}</strong><span>{item.country_name} · {money(amount)}</span>
          </SelectableItem>;
        });
      })()}

      {serviceId === "social" && (() => {
        const services = data.services || [];
        return expandableList("Social media packages", services, (item) => {
          const amount = customerPrice(item.package_id, overrides);
          return <SelectableItem key={item.package_id} item={{ id: item.package_id, name: item.service_name, logo_url: item.logo_url, price: amount, service_id: item.service_id, platform: item.platform, quantity: item.quantity, category: item.category }} selectedId={selectedId} onSelect={onSelect} availability={priceState(item.package_id, overrides)} brandName={item.platform}>
            <strong>{item.package_name || item.service_name}</strong><span>{item.platform} · {Number(item.quantity).toLocaleString()} · {money(amount)}</span>
          </SelectableItem>;
        });
      })()}

      {serviceId === "vtu" && (() => {
        const networks = data.data?.networks || [];
        const plans = Array.isArray(data.data?.plans) && data.data.plans.length
          ? data.data.plans.map((plan) => ({ ...plan, network_name: networks.find((network) => String(network.id) === String(plan.network_id))?.name || plan.network_name || "Mobile data" }))
          : networks.flatMap((network) => (network.plans || []).map((plan) => ({ ...plan, network_name: network.name })));
        return expandableList("Mobile data plans", plans, (plan) => {
          const amount = customerPrice(plan.id, overrides);
          return <SelectableItem key={plan.id} item={{ id: plan.id, name: `${plan.network_name} — ${plan.name}`, price: amount, network_name: plan.network_name, network_id: plan.network_id }} selectedId={selectedId} onSelect={onSelect} availability={priceState(plan.id, overrides)} brandName={plan.network_name}>
            <strong>{plan.network_name} — {plan.name}</strong><span>{money(amount)}</span>
          </SelectableItem>;
        });
      })()}
    </section>
  );
}
