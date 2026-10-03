import {
  Smartphone,
  Store,
  MessageSquareCode,
  TrendingUp,
  Gift,
  Bitcoin,
  Receipt,
  ArrowLeft,
  WalletCards,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import ServiceBrandMark from "../components/ServiceBrandMark";

import { getWalletBalance, purchaseShadexService } from "../services/api";
import { getVtuCatalogue } from "../services/shadexCatalog";
import ShadexCataloguePanel from "./ShadexCataloguePanel";
import WhatsAppSupport from "../components/WhatsAppSupport";

import "./ServicePurchase.css";
import "./ShadexVtu.css";

const serviceMap = {
  vtu: {
    title: "VTU",
    icon: Smartphone,
    description: "Choose airtime and data options available on BukzEx.",
    placeholder: "Enter the required service details",
  },
  bills: {
    title: "Bills",
    icon: Receipt,
    description: "Browse live electricity and cable TV providers.",
    placeholder: "Enter your meter or smartcard details",
  },
  marketplace: {
    title: "Marketplace",
    icon: Store,
    description: "Purchase an available marketplace product.",
    placeholder: "Enter product or order details",
  },
  sms: {
    title: "Virtual SMS / OTP",
    icon: MessageSquareCode,
    description: "Request an available virtual messaging service.",
    placeholder: "Enter the required service details",
  },
  social: {
    title: "Social Media Boost",
    icon: TrendingUp,
    description: "Purchase an available social media service.",
    placeholder: "Enter your account or post details",
  },
  "gift-cards": {
    title: "Gift Cards",
    icon: Gift,
    description: "Purchase an available gift card.",
    placeholder: "Enter gift card details",
  },
  crypto: {
    title: "Crypto",
    icon: Bitcoin,
    description: "Access a supported crypto service.",
    placeholder: "Enter the required service details",
  },
};

function planPrice(plan) {
  const price = plan?.price || {};
  const minorUnit = Number(price.minor_unit ?? 2);
  const amountMinor = Number(price.amount_minor);
  if (!Number.isFinite(amountMinor)) return null;
  return amountMinor / 10 ** minorUnit;
}

function priceLabel(plan, markup = 0, override = null) {
  if (override?.is_active === false) return "Not available";
  if (override?.amount_minor != null) {
    const amount = Number(override.amount_minor) / (10 ** Number(override.minor_unit ?? 2));
    return `${override.currency || "NGN"} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
  const amount = planPrice(plan);
  if (amount === null) return "Price unavailable";
  const customerAmount = amount * (1 + Number(markup || 0) / 100);
  return `${plan.price.currency || "NGN"} ${customerAmount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

export default function ServicePurchase() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const service = serviceMap[serviceId];
  const catalogueOnly = ["bills", "marketplace", "sms", "social"].includes(serviceId);
  const isCheckoutPage = location.pathname.endsWith("/checkout");

  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [catalogue, setCatalogue] = useState(null);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState("");
  const [selectedCatalogueItem, setSelectedCatalogueItem] = useState(() => {
    if (location.state?.selectedCatalogueItem) return location.state.selectedCatalogueItem;
    try { return JSON.parse(sessionStorage.getItem(`bukzex:selected:${serviceId}`) || "null"); }
    catch { return null; }
  });
  const [vtuType, setVtuType] = useState("data");
  const [networkId, setNetworkId] = useState("");
  const [planId, setPlanId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [markup, setMarkup] = useState(0);
  const [priceOverrides, setPriceOverrides] = useState({});
  const [purchaseFor, setPurchaseFor] = useState("myself");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [customerIdentifier, setCustomerIdentifier] = useState("");
  const [targetLink, setTargetLink] = useState("");
  const [servicePhone, setServicePhone] = useState("");
  const [variableBillAmount, setVariableBillAmount] = useState("");

  useEffect(() => {
    if (location.state?.selectedCatalogueItem) {
      setSelectedCatalogueItem(location.state.selectedCatalogueItem);
      return;
    }
    if (isCheckoutPage) {
      try { setSelectedCatalogueItem(JSON.parse(sessionStorage.getItem(`bukzex:selected:${serviceId}`) || "null")); }
      catch { setSelectedCatalogueItem(null); }
    }
  }, [isCheckoutPage, location.state, serviceId]);

  useEffect(() => {
    async function loadWallet() {
      try {
        const result = await getWalletBalance();
        setWalletBalance(Number(result?.balance ?? result?.walletBalance ?? 0));
      } catch {
        setError("Unable to load your wallet balance.");
      } finally {
        setLoading(false);
      }
    }
    loadWallet();
  }, []);

  useEffect(() => {
    let active = true;
    getDoc(doc(db, "services", serviceId))
      .then((snapshot) => {
        if (active && snapshot.exists()) {
          setMarkup(Number(snapshot.data().price_markup_percent || 0));
          setPriceOverrides(snapshot.data().bukzex_prices || {});
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [serviceId]);

  useEffect(() => {
    if (serviceId !== "vtu") return;
    let active = true;
    setCatalogueLoading(true);
    setCatalogueError("");
    getVtuCatalogue()
      .then((result) => {
        if (active) setCatalogue(result);
      })
      .catch((err) => {
        if (active) setCatalogueError("We couldn’t load the catalogue right now. Please try again shortly.");
      })
      .finally(() => {
        if (active) setCatalogueLoading(false);
      });
    return () => {
      active = false;
    };
  }, [serviceId]);

  const networks = useMemo(() => {
    const section = vtuType === "airtime" ? catalogue?.airtime : catalogue?.data;
    const networkRows = Array.isArray(section?.networks) ? section.networks : [];
    if (vtuType !== "data") return networkRows;

    const rows = Array.isArray(section?.plans) ? section.plans : networkRows;
    if (!rows.some((row) => !Array.isArray(row.plans) && (row.network_id || row.price || row.amount_minor != null))) {
      return rows;
    }

    const networkById = new Map(networkRows.map((network) => [String(network.id), network]));
    const groups = new Map();
    for (const plan of rows) {
      const id = String(plan.network_id || "unknown");
      const sourceNetwork = networkById.get(id);
      if (!groups.has(id)) {
        groups.set(id, {
          id,
          code: sourceNetwork?.code || plan.network_code || "",
          name: sourceNetwork?.name || plan.network_name || plan.network_code || "Network",
          plans: [],
        });
      }
      groups.get(id).plans.push(plan);
    }
    return Array.from(groups.values());
  }, [catalogue, vtuType]);

  const selectedNetwork = networks.find((network) => String(network.id) === networkId);
  const plans = (Array.isArray(selectedNetwork?.plans) ? selectedNetwork.plans : [])
    .filter((plan) => {
      const override = priceOverrides[String(plan.id)];
      return override?.is_active !== false && Number(override?.amount_minor) > 0;
    });
  const selectedPlan = plans.find((plan) => String(plan.id) === planId);

  function planCustomerAmount(plan) {
    const override = priceOverrides[String(plan?.id)];
    if (override?.amount_minor != null) {
      return Number(override.amount_minor) / (10 ** Number(override.minor_unit ?? 2));
    }
    return null;
  }

  useEffect(() => {
    if (!networks.length) {
      setNetworkId("");
      setPlanId("");
      return;
    }
    if (!networks.some((network) => String(network.id) === networkId)) {
      setNetworkId(String(networks[0].id));
      setPlanId("");
    }
  }, [networks, networkId]);

  if (!service) {
    return (
      <main className="service-purchase-page">
        <div className="service-purchase-not-found">
          <AlertCircle size={40} />
          <h1>Service not found</h1>
          <p>The selected service is not available.</p>
          <Link to="/customer/services">Back to Services</Link>
        </div>
      </main>
    );
  }

  const Icon = service.icon;

  async function handlePurchase(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (purchaseFor === "friend" && (!recipientName.trim() || !recipientPhone.trim())) {
      setError("Enter your friend's name and phone number.");
      return;
    }

    if (serviceId !== "vtu" && !selectedCatalogueItem?.id) {
      setError("Choose a service before continuing.");
      return;
    }
    if (serviceId === "bills" && (!customerIdentifier.trim() || !(purchaseFor === "friend" ? recipientPhone.trim() : servicePhone.trim()))) {
      setError("Enter the meter or smartcard number and phone number.");
      return;
    }
    if (serviceId === "social" && !targetLink.trim()) {
      setError("Enter the link for the social service.");
      return;
    }
    if (serviceId === "vtu" && (!networkId || !(purchaseFor === "friend" ? recipientPhone.trim() : phoneNumber.trim()))) {
      setError("Choose a network and enter the recipient phone number.");
      return;
    }
    if (serviceId === "vtu" && vtuType === "data" && !planId) {
      setError("Choose a data plan.");
      return;
    }
    if (serviceId === "vtu" && vtuType === "airtime" && (!Number(amount) || Number(amount) < 50)) {
      setError("Enter an airtime amount of at least ₦50.");
      return;
    }
    if (serviceId === "bills" && selectedCatalogueItem.variable_amount && (!Number(variableBillAmount) || Number(variableBillAmount) < 100)) {
      setError("Enter a bill amount of at least ₦100.");
      return;
    }

    const itemId = serviceId === "vtu"
      ? (vtuType === "data" ? planId : "airtime")
      : String(selectedCatalogueItem.id);
    const requestStorageKey = `bukzex-shadex-checkout:${auth.currentUser?.uid || "guest"}:${serviceId}:${itemId}`;
    const requestKey = sessionStorage.getItem(requestStorageKey) || crypto.randomUUID();
    sessionStorage.setItem(requestStorageKey, requestKey);
    setSubmitting(true);
    try {
      const result = await purchaseShadexService({
        service_key: serviceId,
        item_id: itemId,
        idempotency_key: requestKey,
        recipient_type: purchaseFor === "friend" ? "friend" : "self",
        recipient_name: purchaseFor === "friend" ? recipientName.trim() : "",
        recipient_phone: purchaseFor === "friend" ? recipientPhone.trim() : "",
        inputs: serviceId === "vtu" ? {
          service_type: vtuType,
          network_id: networkId,
          network_name: selectedNetwork?.name || "",
          phone_number: purchaseFor === "friend" ? recipientPhone.trim() : phoneNumber.trim(),
          amount: vtuType === "airtime" ? Number(amount) : 0,
        } : {
          phone_number: purchaseFor === "friend" ? recipientPhone.trim() : servicePhone.trim(),
          customer_identifier: customerIdentifier.trim(),
          amount: Number(variableBillAmount || 0),
          variable_amount: selectedCatalogueItem?.variable_amount === true,
          provider_id: selectedCatalogueItem?.provider_id || "",
          item_name: selectedCatalogueItem?.name || "",
          target_link: targetLink.trim(),
        },
      });
      const balance = await getWalletBalance();
      setWalletBalance(Number(balance?.balance || 0));
      setSuccess("Payment complete. Your purchase is now in My Stack.");
      sessionStorage.removeItem(requestStorageKey);
      sessionStorage.removeItem(`bukzex:selected:${serviceId}`);
      window.setTimeout(() => navigate("/customer/orders"), 900);
    } catch (err) {
      const message = String(err?.message || "").toLowerCase();
      if (message.includes("wallet has been refunded") || message.includes("payment reference was already used")) {
        sessionStorage.removeItem(requestStorageKey);
      }
      setError("We couldn’t complete this purchase. Check My Stack before trying again, or contact BukzEx Customer Care.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="service-purchase-page">
      <div className="service-purchase-container">
        <Link to={isCheckoutPage ? `/customer/services/${serviceId}` : "/customer/services"} className="service-purchase-back">
          <ArrowLeft size={16} /> {isCheckoutPage ? "Back to services" : "Back to Services"}
        </Link>

        <div className="service-purchase-header">
          <div className="service-purchase-icon"><Icon size={26} /></div>
          <div>
            <span>BUKZEX SERVICE</span>
            <h1>{service.title}</h1>
            <p>{service.description}</p>
          </div>
        </div>

        <div className="service-wallet-card">
          <div className="service-wallet-icon"><WalletCards size={20} /></div>
          <div>
            <small>AVAILABLE WALLET BALANCE</small>
            <strong>{loading ? "Loading..." : `₦${walletBalance.toLocaleString()}`}</strong>
          </div>
          <Link to="/customer">Fund Wallet</Link>
        </div>

        {catalogueOnly && !isCheckoutPage && (
          <ShadexCataloguePanel
            serviceId={serviceId}
            selectedId={String(selectedCatalogueItem?.id || "")}
            onSelect={(item) => {
              setSelectedCatalogueItem(item);
              sessionStorage.setItem(`bukzex:selected:${serviceId}`, JSON.stringify(item));
              setDetails("");
              const price = item.price;
              const fixedAmount = price?.amount_minor == null
                ? ""
                : String(Number(price.amount_minor) / (10 ** Number(price.minor_unit ?? 2)));
              setAmount(fixedAmount);
              setError("");
              navigate(`/customer/services/${serviceId}/checkout`, { state: { selectedCatalogueItem: item } });
            }}
          />
        )}

        {catalogueOnly && isCheckoutPage && selectedCatalogueItem && (
          <form className="service-purchase-form" onSubmit={handlePurchase}>
            <div className="service-form-heading">
              <h2>Checkout</h2>
              <div className="service-checkout-product">
                <ServiceBrandMark name={selectedCatalogueItem.name} logoUrl={selectedCatalogueItem.logo_url} size="small" />
                <p>{selectedCatalogueItem.name} · BukzEx secure checkout</p>
              </div>
            </div>
            <div className="service-form-field">
              <label>Who is this purchase for?</label>
              <div className="purchase-for-options">
                <label><input type="radio" name="purchase-for" value="myself" checked={purchaseFor === "myself"} onChange={() => setPurchaseFor("myself")} /> Myself</label>
                <label><input type="radio" name="purchase-for" value="friend" checked={purchaseFor === "friend"} onChange={() => setPurchaseFor("friend")} /> A friend</label>
              </div>
            </div>
            {purchaseFor === "friend" && <div className="service-form-field">
              <label htmlFor="friend-name">Friend’s name</label>
              <input id="friend-name" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="Enter their name" />
              <label htmlFor="friend-phone" className="friend-phone-label">Friend’s phone number</label>
              <input id="friend-phone" type="tel" value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} placeholder="Enter their phone number" />
            </div>}
            {serviceId === "bills" && <div className="service-form-field">
              <label htmlFor="customer-identifier">Meter or smartcard number</label>
              <input id="customer-identifier" value={customerIdentifier} onChange={(event) => setCustomerIdentifier(event.target.value)} placeholder="Enter the number" />
              {purchaseFor !== "friend" && <><label htmlFor="bill-phone" className="friend-phone-label">Phone number</label><input id="bill-phone" type="tel" value={servicePhone} onChange={(event) => setServicePhone(event.target.value)} placeholder="Enter phone number" /></>}
              {selectedCatalogueItem.variable_amount && <><label htmlFor="bill-amount" className="friend-phone-label">Bill amount (₦)</label><input id="bill-amount" type="number" min="100" value={variableBillAmount} onChange={(event) => setVariableBillAmount(event.target.value)} placeholder="Enter bill amount" /></>}
            </div>}
            {serviceId === "social" && <div className="service-form-field"><label htmlFor="social-target-link">Link to the post or account</label><input id="social-target-link" type="url" value={targetLink} onChange={(event) => setTargetLink(event.target.value)} placeholder="https://…" /></div>}
            <div className="service-purchase-total">
              <div><span>Available wallet balance</span><strong>{loading ? "Loading…" : `₦${walletBalance.toLocaleString()}`}</strong></div>
              <div><span>Price</span><strong>{selectedCatalogueItem.variable_amount ? "Enter amount" : selectedCatalogueItem.price ? priceLabel(selectedCatalogueItem, 0, selectedCatalogueItem.price) : "Price unavailable"}</strong></div>
            </div>
            <p className="service-request-notice">Payment is securely deducted from your BukzEx wallet. Your purchase and available delivery details will appear in My Stack. Contact BukzEx Customer Care for OTP or password assistance.</p>
            {error && <div className="service-form-message error"><AlertCircle size={17} /><span>{error}</span></div>}
            {success && <div className="service-form-message success"><CheckCircle2 size={17} /><span>{success}</span></div>}
            <button type="submit" className="service-purchase-submit" disabled={submitting || loading}>
              {submitting ? "Processing payment…" : "Pay with wallet"}
            </button>
            <button type="button" className="service-catalogue-change" onClick={() => { setSelectedCatalogueItem(null); setAmount(""); setDetails(""); setError(""); sessionStorage.removeItem(`bukzex:selected:${serviceId}`); navigate(`/customer/services/${serviceId}`); }}>
              Choose a different service
            </button>
          </form>
        )}

        {catalogueOnly && isCheckoutPage && !selectedCatalogueItem && (
          <section className="service-purchase-form service-checkout-empty">
            <h2>Choose a service to continue</h2>
            <p>Your selection is no longer available. Return to the catalogue and choose a service.</p>
            <Link to={`/customer/services/${serviceId}`} className="service-purchase-submit">Browse services</Link>
          </section>
        )}

        {!catalogueOnly && (
        <form className="service-purchase-form" onSubmit={handlePurchase}>
            <div className="service-form-heading">
            <h2>{serviceId === "vtu" ? "Choose Airtime or Data" : "Request a Service"}</h2>
            <p>
              {serviceId === "vtu"
                ? `Browse available options. BukzEx pricing: ${markup}% markup.`
                : "Choose the service option you need."}
            </p>
          </div>

          <div className="service-form-field">
            <label>Who is this purchase for?</label>
            <div className="purchase-for-options">
              <label><input type="radio" name="purchase-for-other" value="myself" checked={purchaseFor === "myself"} onChange={() => setPurchaseFor("myself")} /> Myself</label>
              <label><input type="radio" name="purchase-for-other" value="friend" checked={purchaseFor === "friend"} onChange={() => setPurchaseFor("friend")} /> A friend</label>
            </div>
          </div>
          {purchaseFor === "friend" && <div className="service-form-field">
            <label htmlFor="friend-name-other">Friend’s name</label>
            <input id="friend-name-other" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="Enter their name" />
            <label htmlFor="friend-phone-other" className="friend-phone-label">Friend’s phone number</label>
            <input id="friend-phone-other" type="tel" value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} placeholder="Enter their phone number" />
          </div>}

          {serviceId === "vtu" ? (
            <>
              {catalogueLoading && <p role="status">Loading live VTU options…</p>}
              {catalogueError && <div className="service-form-message error"><AlertCircle size={17} /><span>{catalogueError}</span></div>}
              {catalogue && (
                <>
                  <div className="service-form-field">
                    <label htmlFor="vtu-type">Service type</label>
                    <select id="vtu-type" value={vtuType} onChange={(event) => { setVtuType(event.target.value); setNetworkId(""); setPlanId(""); }}>
                      <option value="data">Data</option>
                      <option value="airtime">Airtime</option>
                    </select>
                  </div>
                  <div className="service-form-field">
                    <label htmlFor="vtu-network">Network</label>
                    <select id="vtu-network" value={networkId} onChange={(event) => { setNetworkId(event.target.value); setPlanId(""); }}>
                      {networks.map((network) => <option key={network.id} value={network.id}>{network.name}</option>)}
                    </select>
                  </div>
                  {vtuType === "data" ? (
                    <div className="service-form-field">
                      <label htmlFor="vtu-plan">Data plan</label>
                      <select id="vtu-plan" value={planId} onChange={(event) => setPlanId(event.target.value)}>
                        <option value="">Select a data plan</option>
                        {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} — {priceLabel(plan, markup, priceOverrides[String(plan.id)])}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="service-form-field">
                      <label htmlFor="service-amount">Airtime amount (₦)</label>
                    <input id="service-amount" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" />
                    <small className="service-price-hint">Estimated customer total with {markup}% markup: ₦{(Number(amount || 0) * (1 + markup / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</small>
                    </div>
                  )}
                  <div className="service-form-field">
                    <label htmlFor="vtu-phone">Phone number</label>
                    <input id="vtu-phone" type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="08012345678" />
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="service-form-field">
                <label htmlFor="service-amount">Amount</label>
                <input id="service-amount" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" />
              </div>
              <div className="service-form-field">
                <label htmlFor="service-details">Service Details</label>
                <textarea id="service-details" value={details} onChange={(event) => setDetails(event.target.value)} placeholder={service.placeholder} rows="5" />
              </div>
            </>
          )}

          {error && <div className="service-form-message error"><AlertCircle size={17} /><span>{error}</span></div>}
          <p className="service-request-notice">Payment is securely deducted from your BukzEx wallet. Track your purchase and available delivery details in My Stack.</p>
          <button type="submit" className="service-purchase-submit" disabled={submitting || loading || (vtuType === "data" && !planId)}>
            {submitting ? "Processing payment…" : "Pay with wallet"}
          </button>
        </form>
        )}
      </div>
      <WhatsAppSupport />
    </main>
  );
}
