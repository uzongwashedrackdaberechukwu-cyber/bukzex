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
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getWalletBalance,
  purchaseService,
} from "../services/api";
import { getVtuCatalogue } from "../services/shadexCatalog";
import ShadexCataloguePanel from "./ShadexCataloguePanel";

import "./ServicePurchase.css";
import "./ShadexVtu.css";

const serviceMap = {
  vtu: {
    title: "VTU",
    icon: Smartphone,
    description: "Choose live airtime and data options from ShadexGoLtd.",
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

function priceLabel(plan) {
  const amount = planPrice(plan);
  if (amount === null) return "Price unavailable";
  return `${plan.price.currency || "NGN"} ${amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

export default function ServicePurchase() {
  const { serviceId } = useParams();
  const service = serviceMap[serviceId];
  const catalogueOnly = ["bills", "marketplace", "sms", "social"].includes(serviceId);

  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [catalogue, setCatalogue] = useState(null);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState("");
  const [vtuType, setVtuType] = useState("data");
  const [networkId, setNetworkId] = useState("");
  const [planId, setPlanId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

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
    if (serviceId !== "vtu") return;
    let active = true;
    setCatalogueLoading(true);
    setCatalogueError("");
    getVtuCatalogue()
      .then((result) => {
        if (active) setCatalogue(result);
      })
      .catch((err) => {
        if (active) setCatalogueError(err?.message || "Unable to load VTU options.");
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
    return Array.isArray(section?.networks) ? section.networks : [];
  }, [catalogue, vtuType]);

  const selectedNetwork = networks.find((network) => String(network.id) === networkId);
  const plans = Array.isArray(selectedNetwork?.plans) ? selectedNetwork.plans : [];
  const selectedPlan = plans.find((plan) => String(plan.id) === planId);

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

    let numericAmount = Number(amount);
    let requestDetails = details.trim();

    if (serviceId === "vtu") {
      if (!selectedNetwork) {
        setError("Choose a network.");
        return;
      }
      if (!phoneNumber.trim()) {
        setError("Enter the phone number to receive the service.");
        return;
      }
      if (vtuType === "data") {
        if (!selectedPlan) {
          setError("Choose a data plan.");
          return;
        }
        numericAmount = planPrice(selectedPlan);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
          setError("The selected data plan has no valid price.");
          return;
        }
      } else if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        setError("Enter a valid airtime amount.");
        return;
      }
      requestDetails = JSON.stringify({
        service_type: vtuType,
        network_id: String(selectedNetwork.id),
        network_code: selectedNetwork.code || "",
        network_name: selectedNetwork.name || "",
        data_plan_id: selectedPlan ? String(selectedPlan.id) : null,
        data_plan_name: selectedPlan?.name || null,
        phone_number: phoneNumber.trim(),
        currency: selectedPlan?.price?.currency || catalogue?.market?.currency || "NGN",
      });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!requestDetails) {
      setError("Please enter the required service details.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await purchaseService({
        service: serviceId,
        amount: numericAmount,
        details: requestDetails,
      });
      setSuccess(result?.message || "Your order has been submitted for review.");
      if (result?.balance !== undefined) setWalletBalance(Number(result.balance));
      setAmount("");
      setDetails("");
      setPhoneNumber("");
      setPlanId("");
    } catch (err) {
      setError(err?.message || "Unable to submit the request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="service-purchase-page">
      <div className="service-purchase-container">
        <Link to="/customer" className="service-purchase-back">
          <ArrowLeft size={16} /> Back to Dashboard
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

        {catalogueOnly && (
          <ShadexCataloguePanel serviceId={serviceId} />
        )}

        {!catalogueOnly && (
        <form className="service-purchase-form" onSubmit={handlePurchase}>
          <div className="service-form-heading">
            <h2>{serviceId === "vtu" ? "Choose Airtime or Data" : "Request a Service"}</h2>
            <p>
              {serviceId === "vtu"
                ? "Prices and plans load from ShadexGoLtd. This submits a review request; no wallet money is taken."
                : "Send your request for administrator review. No wallet money is taken until provider pricing and fulfillment are connected."}
            </p>
          </div>

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
                        {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} — {priceLabel(plan)}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="service-form-field">
                      <label htmlFor="service-amount">Airtime amount (₦)</label>
                      <input id="service-amount" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" />
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
          {success && <div className="service-form-message success"><CheckCircle2 size={17} /><span>{success}</span></div>}

          <button type="submit" className="service-purchase-submit" disabled={submitting || loading || (serviceId === "vtu" && (catalogueLoading || !catalogue))}>
            {submitting ? <><LoaderCircle size={17} className="service-spinner" /> Processing...</> : "Submit for Review"}
          </button>
        </form>
        )}
      </div>
    </main>
  );
}
