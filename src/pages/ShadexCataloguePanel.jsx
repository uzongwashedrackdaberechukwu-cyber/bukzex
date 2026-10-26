import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Search,
  X,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import {
  publicCatalogueData,
  publicText,
} from "../../bukzex-shadex-catalog-worker/src/public-catalogue.js";
import ServiceBrandMark from "../components/ServiceBrandMark";
import { getShadexCatalogue } from "../services/shadexCatalog";

function matchesSearch(item, query) {
  const needle = String(query || "")
    .trim()
    .toLowerCase();
  if (!needle) return true;
  return [
    item.name,
    item.title,
    item.service_name,
    item.service_slug,
    item.package_name,
    item.platform,
    item.country_name,
    item.country_code,
    item.category_name,
    item.network_name,
    item.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(needle);
}
function displayPlatform(value) {
  const names = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    telegram: "Telegram",
    twitter: "X / Twitter",
    x: "X",
    spotify: "Spotify",
  };
  return names[String(value).toLowerCase()] || publicText(value);
}

function customerPrice(id, overrides) {
  const saved = overrides[String(id)];
  if (
    !saved ||
    saved.is_active === false ||
    saved.amount_minor == null ||
    Number(saved.amount_minor) <= 0
  )
    return null;
  return saved;
}

function uniqueMarketplaceProducts(rows, overrides) {
  const byName = new Map();
  for (const product of Array.isArray(rows) ? rows : []) {
    const key = [
      String(product.service_slug || product.service_name || "")
        .trim()
        .toLowerCase(),
      String(product.name || product.title || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " "),
      product.duration ?? "",
      String(product.duration_unit || "")
        .trim()
        .toLowerCase(),
    ].join("|");
    const existing = byName.get(key);
    // Prefer the duplicate whose BukzEx retail price is already configured.
    if (
      !existing ||
      (!customerPrice(existing.id, overrides) &&
        customerPrice(product.id, overrides))
    ) {
      byName.set(key, product);
    }
  }
  return [...byName.values()].filter((product) =>
    Boolean(customerPrice(product.id, overrides)),
  );
}

function priceState(id, overrides) {
  const saved = overrides[String(id)];
  if (saved?.is_active === false) return "paused";
  if (saved?.amount_minor == null || Number(saved.amount_minor) <= 0)
    return "pending";
  return "ready";
}

function money(price) {
  if (price?.amount_minor == null) return "Price not set";
  const value =
    Number(price.amount_minor) / 10 ** Number(price.minor_unit ?? 2);
  if (!Number.isFinite(value)) return "Price not set";
  return `${(price.currency || "NGN") === "NGN" ? "₦" : `${price.currency} `}${value.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

function expandableList(title, rows, renderRow) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <div className="shadex-empty-state">
        <span className="shadex-empty-icon">
          <Clock3 size={19} />
        </span>
        <div>
          <strong>No options are available right now</strong>
          <p>Check back later for new BukzEx services.</p>
        </div>
      </div>
    );
  }
  return (
    <section className="shadex-catalogue-group">
      <div className="shadex-catalogue-group-heading">
        <h3>{title}</h3>
        <span>{rows.length} options</span>
      </div>
      <div className="shadex-catalogue-list">{rows.map(renderRow)}</div>
    </section>
  );
}

function SelectableItem({
  item,
  selectedId,
  onSelect,
  children,
  className = "",
  brandName = "",
  availability = "ready",
}) {
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
      title={
        disabled
          ? availability === "paused"
            ? "This option is currently unavailable"
            : "BukzEx is setting the price for this option"
          : "Select this option"
      }
    >
      <ServiceBrandMark
        name={brandName || item.name}
        logoUrl={item.logo_url}
        size="small"
      />
      <span className="shadex-catalogue-item-copy">{children}</span>
      <span className="bx-option-action">
        {disabled ? (
          <span className={`shadex-price-state ${availability}`}>
            {availability === "paused" ? "Unavailable" : "Price pending"}
          </span>
        ) : active ? (
          <CheckCircle2 size={19} aria-label="Selected" />
        ) : (
          <ArrowUpRight size={18} aria-hidden="true" />
        )}
      </span>
    </button>
  );
}

function NestedPlans({
  rows,
  label,
  overrides,
  selectedId,
  onSelect,
  query = "",
}) {
  const providers = (rows || [])
    .map((provider) => {
      const fee = customerPrice(`fee-${provider.id}`, overrides);
      const plans = (provider.plans || []).map((plan) => ({
        ...plan,
        customer_price: plan.variable_amount
          ? null
          : customerPrice(plan.id, overrides),
        price_state:
          plan.variable_amount && fee
            ? "ready"
            : priceState(plan.id, overrides),
      }));
      return {
        ...provider,
        customer_fee: fee,
        visible_plans: matchesSearch(provider, query)
          ? plans
          : plans.filter((plan) => matchesSearch(plan, query)),
      };
    })
    .filter(
      (provider) =>
        !query ||
        matchesSearch(provider, query) ||
        provider.visible_plans.length > 0,
    );

  return expandableList(label, providers, (provider) => (
    <details className="shadex-catalogue-provider" key={provider.id}>
      <summary>
        <ServiceBrandMark
          name={provider.name || provider.title || provider.identifier}
          logoUrl={provider.logo_url}
          size="medium"
        />
        <span className="bx-provider-copy">
          <strong>
            {publicText(provider.name || provider.title || provider.identifier)}
          </strong>
          <small>
            {provider.visible_plans.length} available option
            {provider.visible_plans.length === 1 ? "" : "s"}
          </small>
        </span>
        <ChevronDown
          size={18}
          className="bx-provider-chevron"
          aria-hidden="true"
        />
      </summary>
      <div className="shadex-catalogue-sublist">
        {provider.customer_fee ? (
          <div className="shadex-catalogue-fee">
            <span>BukzEx service fee</span>
            <strong>{money(provider.customer_fee)}</strong>
          </div>
        ) : (
          <div className="shadex-catalogue-fee pending">
            <span>BukzEx service fee</span>
            <strong>Price pending</strong>
          </div>
        )}
        {provider.visible_plans.map((plan) => (
          <SelectableItem
            key={plan.id}
            item={{
              id: plan.id,
              name: plan.name,
              logo_url: plan.logo_url || provider.logo_url,
              price: plan.customer_price,
              provider_id: provider.id,
              plan_type: plan.plan_type,
              variable_amount: plan.variable_amount === true,
            }}
            selectedId={selectedId}
            onSelect={onSelect}
            className="shadex-catalogue-line-button"
            brandName={provider.name || provider.title || provider.identifier}
            availability={plan.price_state}
          >
            <strong>{plan.name}</strong>
            <span>
              {plan.variable_amount
                ? "Enter amount · service fee applies"
                : money(plan.customer_price)}
            </span>
          </SelectableItem>
        ))}
      </div>
    </details>
  ));
}

export default function ShadexCataloguePanel({
  serviceId,
  selectedId = "",
  onSelect = () => {},
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overrides, setOverrides] = useState({});
  const [filters, setFilters] = useState({ serviceId, query: "" });
  const marketplaceSearch =
    filters.serviceId === serviceId ? filters.query : "";
  const setMarketplaceSearch = (query) => setFilters({ serviceId, query });

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    getShadexCatalogue(serviceId)
      .then((result) => {
        if (live) setData(publicCatalogueData(result));
      })
      .catch((err) => {
        if (live)
          setError(
            err?.message ||
              "This catalogue is temporarily unavailable. Please try again shortly.",
          );
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [serviceId]);

  useEffect(() => {
    let live = true;
    Promise.all([
      getDoc(doc(db, "services", serviceId)),
      getDocs(collection(db, "services", serviceId, "prices")),
    ])
      .then(([serviceSnapshot, pricesSnapshot]) => {
        if (!live) return;
        const legacy = serviceSnapshot.exists()
          ? serviceSnapshot.data().bukzex_prices || {}
          : {};
        const saved = Object.fromEntries(
          pricesSnapshot.docs.map((priceDoc) => {
            const price = priceDoc.data();
            return [
              String(price.item_id || decodeURIComponent(priceDoc.id)),
              price,
            ];
          }),
        );
        setOverrides({ ...legacy, ...saved });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [serviceId]);

  if (loading)
    return (
      <div className="shadex-catalogue-status">
        <LoaderCircle size={18} className="service-spinner" /> Loading service
        options…
      </div>
    );
  if (error)
    return (
      <div className="shadex-catalogue-status error">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  if (!data) return null;

  const currency = data.market?.currency || "NGN";
  const headings = {
    marketplace: "Choose your subscription",
    bills: "Choose your bill provider",
    sms: "Choose your virtual number",
    rental: "Choose your number rental",
    email_verification: "Choose your email service",
    social: "Choose your social package",
    vtu: "Choose your data plan",
  };
  const searchLabel =
    serviceId === "marketplace"
      ? "Search digital subscriptions"
      : "Search catalogue options";
  return (
    <section
      className={`shadex-catalogue-panel ${serviceId === "marketplace" ? "marketplace" : ""}`}
    >
      <div className="shadex-catalogue-heading">
        <div>
          <span className="shadex-catalogue-eyebrow">BUKZEX CATALOGUE</span>
          <h2>{headings[serviceId] || "Choose an option"}</h2>
        </div>
        <small>
          {currency}
          {data.market?.countryCode ? ` · ${data.market.countryCode}` : ""}
        </small>
      </div>
      <p className="shadex-catalogue-intro">
        Compare the available options. Review your selection before you pay.
      </p>
      <div className="bx-catalogue-search-row">
        <label className="bx-catalogue-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={marketplaceSearch}
            onChange={(event) => setMarketplaceSearch(event.target.value)}
            placeholder={
              serviceId === "marketplace"
                ? "Search subscriptions, apps or plans"
                : "Search services, providers or countries"
            }
            aria-label={searchLabel}
          />
          {marketplaceSearch && (
            <button
              type="button"
              onClick={() => setMarketplaceSearch("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </label>
        <span>Prices in {currency}</span>
      </div>

      {serviceId === "bills" && (
        <>
          <NestedPlans
            rows={data.electricity?.providers}
            query={marketplaceSearch}
            label="Electricity"
            overrides={overrides}
            selectedId={selectedId}
            onSelect={onSelect}
          />
          <NestedPlans
            rows={data.cable?.providers}
            query={marketplaceSearch}
            label="Cable TV"
            overrides={overrides}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </>
      )}

      {serviceId === "marketplace" &&
        (() => {
          const query = marketplaceSearch.trim().toLowerCase();
          const allProducts = uniqueMarketplaceProducts(
            data.products,
            overrides,
          );
          const products = allProducts.filter((product) =>
            [
              product.title,
              product.name,
              product.service_name,
              product.category_name,
              product.short_description,
              product.service_slug,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(query),
          );
          return (
            <>
              <div className="bx-catalogue-result-count" role="status">
                {products.length} matching subscription
                {products.length === 1 ? "" : "s"}
              </div>
              {products.length ? (
                expandableList("Digital subscriptions", products, (product) => {
                  const amount = customerPrice(product.id, overrides);
                  return (
                    <SelectableItem
                      key={product.id}
                      item={{
                        id: product.id,
                        name:
                          product.title || product.name || "Digital service",
                        logo_url: product.logo_url || product.image_url,
                        price: amount,
                        provider_product_id: product.provider_product_id,
                        service_slug: product.service_slug,
                      }}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      availability="ready"
                      brandName={
                        product.service_name || product.title || product.name
                      }
                    >
                      <strong>
                        {publicText(
                          product.title || product.name || "Digital service",
                        )}
                      </strong>
                      <span>{money(amount)}</span>
                    </SelectableItem>
                  );
                })
              ) : (
                <div className="shadex-empty-state">
                  <span className="shadex-empty-icon">
                    <Search size={19} />
                  </span>
                  <div>
                    <strong>No matching subscriptions</strong>
                    <p>Try a different service name or clear your search.</p>
                  </div>
                </div>
              )}
            </>
          );
        })()}

      {serviceId === "rental" &&
        (() => {
          const services = (data.services || []).filter(
            (item) =>
              Boolean(customerPrice(item.id, overrides)) &&
              matchesSearch(item, marketplaceSearch),
          );
          return expandableList("Virtual number rentals", services, (item) => {
            const amount = customerPrice(item.id, overrides);
            return (
              <SelectableItem
                key={item.id}
                item={{
                  id: item.id,
                  name: `${item.country_name || item.country_code || "Virtual number"} rental`,
                  logo_url: item.logo_url,
                  price: amount,
                  country_code: item.country_code,
                  country_name: item.country_name,
                  minimum_months: Number(item.minimum_months || 1),
                  maximum_months: Number(item.maximum_months || 12),
                  stock_count: Number(item.stock_count || 0),
                }}
                selectedId={selectedId}
                onSelect={onSelect}
                availability="ready"
                brandName={
                  item.country_name || item.country_code || "Virtual number"
                }
              >
                <strong>
                  {item.country_name || item.country_code || "Virtual number"}{" "}
                  rental
                </strong>
                <span>
                  {money(amount)} / month · {item.minimum_months || 1}–
                  {item.maximum_months || 12} months · {item.stock_count ?? 0}{" "}
                  available
                </span>
              </SelectableItem>
            );
          });
        })()}

      {serviceId === "email_verification" &&
        (() => {
          const services = (data.services || []).filter((item) =>
            matchesSearch(item, marketplaceSearch),
          );
          return expandableList("Email verification", services, (item) => {
            const amount = customerPrice(item.id, overrides);
            return (
              <SelectableItem
                key={item.id}
                className="shadex-email-option"
                item={{
                  id: item.id,
                  name: item.service_name,
                  logo_url: item.logo_url,
                  price: amount,
                }}
                selectedId={selectedId}
                onSelect={onSelect}
                availability={priceState(item.id, overrides)}
                brandName={item.service_name}
              >
                <strong>{publicText(item.service_name)}</strong>
                <span>{money(amount)}</span>
              </SelectableItem>
            );
          });
        })()}

      {serviceId === "sms" &&
        (() => {
          const services = (data.services || []).filter((item) =>
            matchesSearch(item, marketplaceSearch),
          );
          const renderSms = (item) => {
            const amount = customerPrice(item.id, overrides);
            const server = item.provider_server_id || "server2";
            return (
              <SelectableItem
                key={item.id}
                item={{
                  id: item.id,
                  name: item.service_name,
                  logo_url: item.logo_url,
                  price: amount,
                  country_code: item.country_code,
                  country_name: item.country_name,
                  provider_service_id: item.provider_service_id,
                  provider_server_id: server,
                }}
                selectedId={selectedId}
                onSelect={onSelect}
                availability={priceState(item.id, overrides)}
                brandName={item.service_name}
              >
                <strong>{publicText(item.service_name)}</strong>
                <span>
                  {item.country_name} · {money(amount)}
                </span>
              </SelectableItem>
            );
          };

          return (
            <>
              {services.length === 0 && (
                <div className="shadex-empty-state">
                  <Search size={22} />
                  <div>
                    <strong>No matching numbers</strong>
                    <p>Try another service or country.</p>
                  </div>
                </div>
              )}
              {services.some((item) => item.provider_server_id === "server1") &&
                expandableList(
                  "Virtual numbers · Group 1",
                  services.filter(
                    (item) => item.provider_server_id === "server1",
                  ),
                  renderSms,
                )}
              {services.some(
                (item) =>
                  !item.provider_server_id ||
                  item.provider_server_id === "server2",
              ) &&
                expandableList(
                  "Virtual numbers · Group 2",
                  services.filter(
                    (item) =>
                      !item.provider_server_id ||
                      item.provider_server_id === "server2",
                  ),
                  renderSms,
                )}
            </>
          );
        })()}

      {serviceId === "social" &&
        (() => {
          const services = (data.services || []).filter((item) =>
            matchesSearch(item, marketplaceSearch),
          );
          const groups = services.reduce((result, item) => {
            const platform = publicText(item.platform || "Other");
            (result[platform] ||= []).push(item);
            return result;
          }, {});
          return (
            <section className="shadex-catalogue-group shadex-social-groups">
              <div className="shadex-catalogue-group-heading">
                <h3>Choose a platform</h3>
                <span>{Object.keys(groups).length} platforms</span>
              </div>
              <div className="shadex-social-platform-grid">
                {Object.entries(groups).map(([platform, packages]) => (
                  <details className="shadex-social-platform" key={platform}>
                    <summary>
                      <ServiceBrandMark name={platform} size="medium" />
                      <span className="shadex-social-platform-copy">
                        <strong>{displayPlatform(platform)}</strong>
                        <small>{packages.length} packages</small>
                      </span>
                      <span className="shadex-social-view">
                        View packages{" "}
                        <ChevronDown size={17} aria-hidden="true" />
                      </span>
                    </summary>
                    <div className="shadex-social-packages">
                      {packages.map((item) => {
                        const amount = customerPrice(
                          item.package_id,
                          overrides,
                        );
                        return (
                          <SelectableItem
                            key={item.package_id}
                            className="shadex-social-package"
                            item={{
                              id: item.package_id,
                              name: item.service_name,
                              logo_url: item.logo_url,
                              price: amount,
                              service_id: item.service_id,
                              platform: item.platform,
                              quantity: item.quantity,
                              category: item.category,
                            }}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            availability={priceState(
                              item.package_id,
                              overrides,
                            )}
                            brandName={item.platform}
                          >
                            <strong>
                              {item.package_name || item.service_name}
                            </strong>
                            <span>
                              {platform} ·{" "}
                              {Number(item.quantity).toLocaleString()} ·{" "}
                              {money(amount)}
                            </span>
                          </SelectableItem>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          );
        })()}

      {serviceId === "vtu" &&
        (() => {
          const networks = data.data?.networks || [];
          const plans =
            Array.isArray(data.data?.plans) && data.data.plans.length
              ? data.data.plans.map((plan) => ({
                  ...plan,
                  network_name:
                    networks.find(
                      (network) =>
                        String(network.id) === String(plan.network_id),
                    )?.name ||
                    plan.network_name ||
                    "Mobile data",
                }))
              : networks.flatMap((network) =>
                  (network.plans || []).map((plan) => ({
                    ...plan,
                    network_name: network.name,
                  })),
                );
          return expandableList(
            "Mobile data plans",
            plans.filter((plan) => matchesSearch(plan, marketplaceSearch)),
            (plan) => {
              const amount = customerPrice(plan.id, overrides);
              return (
                <SelectableItem
                  key={plan.id}
                  item={{
                    id: plan.id,
                    name: `${plan.network_name} — ${plan.name}`,
                    price: amount,
                    network_name: plan.network_name,
                    network_id: plan.network_id,
                  }}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  availability={priceState(plan.id, overrides)}
                  brandName={plan.network_name}
                >
                  <strong>
                    {plan.network_name} — {plan.name}
                  </strong>
                  <span>{money(amount)}</span>
                </SelectableItem>
              );
            },
          );
        })()}
    </section>
  );
}
