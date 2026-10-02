import { useEffect, useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { getShadexCatalogue } from "../services/shadexCatalog";
import "./ShadexCataloguePanel.css";

function money(price) {
  const value = Number(price?.amount_minor);
  if (!Number.isFinite(value)) return "Price varies";
  const unit = Number(price?.minor_unit ?? 2);
  const major = value / 10 ** unit;
  return `${price?.currency || "NGN"} ${major.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
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

function NestedPlans({ rows, label }) {
  return expandableList(label, rows, (row) => (
    <details className="shadex-catalogue-item" key={row.id}>
      <summary>{row.name || row.title || row.identifier}</summary>
      <div className="shadex-catalogue-sublist">
        {(row.plans || []).map((plan) => (
          <div className="shadex-catalogue-line" key={plan.id}>
            <span>{plan.name}</span>
            <strong>{plan.variable_amount ? "Variable amount" : money({ amount_minor: plan.amount_minor, currency: plan.currency, minor_unit: plan.minor_unit })}</strong>
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

  if (loading) return <div className="shadex-catalogue-status"><LoaderCircle size={17} className="service-spinner" /> Loading live catalogue…</div>;
  if (error) return <div className="shadex-catalogue-status error"><AlertCircle size={17} /> ShadexGoLtd catalogue is temporarily unavailable: {error}</div>;
  if (!data) return null;

  return (
    <section className="shadex-catalogue-panel">
      <div className="shadex-catalogue-heading">
        <span>LIVE FROM SHADEXGOLTD</span>
        <small>{data.market?.currency || "NGN"} · {data.market?.countryCode || ""}</small>
      </div>

      {serviceId === "bills" && <>
        <NestedPlans rows={data.electricity?.providers} label="Electricity providers" />
        <NestedPlans rows={data.cable?.providers} label="Cable TV providers" />
      </>}

      {serviceId === "marketplace" && expandableList(
        "Products",
        data.products,
        (product) => <div className="shadex-catalogue-item" key={product.id}><strong>{product.title || product.name || "Product"}</strong><span>{money(product.price || product)}</span></div>,
      )}

      {serviceId === "sms" && expandableList(
        "OTP services",
        data.services,
        (item) => <div className="shadex-catalogue-item" key={item.id}><strong>{item.service_name}</strong><span>{item.country_name} · {money(item.price)}</span></div>,
      )}

      {serviceId === "social" && expandableList(
        "Social Boost packages",
        data.services,
        (item) => <div className="shadex-catalogue-item" key={item.package_id}><strong>{item.service_name}</strong><span>{item.platform} · {Number(item.quantity).toLocaleString()} · {money(item.price)}</span></div>,
      )}
    </section>
  );
}
