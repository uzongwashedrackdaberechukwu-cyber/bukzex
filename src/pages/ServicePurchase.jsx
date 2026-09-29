import {
  Smartphone,
  Store,
  MessageSquareCode,
  TrendingUp,
  Gift,
  Bitcoin,
  ArrowLeft,
  WalletCards,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getWalletBalance,
  purchaseService,
} from "../services/api";

import "./ServicePurchase.css";

const serviceMap = {
  vtu: {
    title: "VTU",
    icon: Smartphone,
    description: "Purchase an available VTU service.",
    placeholder: "Enter the required service details",
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

export default function ServicePurchase() {
  const { serviceId } = useParams();

  const service = serviceMap[serviceId];

  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadWallet() {
      try {
        const result = await getWalletBalance();

        setWalletBalance(
          Number(result?.balance ?? result?.walletBalance ?? 0)
        );
      } catch (err) {
        setError("Unable to load your wallet balance.");
      } finally {
        setLoading(false);
      }
    }

    loadWallet();
  }, []);

  if (!service) {
    return (
      <main className="service-purchase-page">
        <div className="service-purchase-not-found">
          <AlertCircle size={40} />
          <h1>Service not found</h1>
          <p>The selected service is not available.</p>
          <Link to="/customer/services">
            Back to Services
          </Link>
        </div>
      </main>
    );
  }

  const Icon = service.icon;

  async function handlePurchase(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (numericAmount > walletBalance) {
      setError(
        "Insufficient wallet balance. Please fund your wallet before purchasing."
      );
      return;
    }

    if (!details.trim()) {
      setError("Please enter the required service details.");
      return;
    }

    try {
      setSubmitting(true);

      const result = await purchaseService({
        service: serviceId,
        amount: numericAmount,
        details: details.trim(),
      });

      setSuccess(
        result?.message ||
          "Your order has been submitted successfully."
      );

      if (result?.balance !== undefined) {
        setWalletBalance(Number(result.balance));
      } else {
        setWalletBalance((current) => current - numericAmount);
      }

      setAmount("");
      setDetails("");
    } catch (err) {
      setError(
        err?.message ||
          "Unable to submit the order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="service-purchase-page">
      <div className="service-purchase-container">

        <Link
          to="/customer"
          className="service-purchase-back"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="service-purchase-header">
          <div className="service-purchase-icon">
            <Icon size={26} />
          </div>

          <div>
            <span>BUKZEX SERVICE</span>
            <h1>{service.title}</h1>
            <p>{service.description}</p>
          </div>
        </div>

        <div className="service-wallet-card">
          <div className="service-wallet-icon">
            <WalletCards size={20} />
          </div>

          <div>
            <small>AVAILABLE WALLET BALANCE</small>

            <strong>
              {loading
                ? "Loading..."
                : `₦${walletBalance.toLocaleString()}`}
            </strong>
          </div>

          <Link to="/customer">
            Fund Wallet
          </Link>
        </div>

        <form
          className="service-purchase-form"
          onSubmit={handlePurchase}
        >
          <div className="service-form-heading">
            <h2>Purchase Service</h2>
            <p>
              Enter the information required to process your
              purchase.
            </p>
          </div>

          <div className="service-form-field">
            <label htmlFor="service-amount">
              Amount
            </label>

            <input
              id="service-amount"
              type="number"
              min="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div className="service-form-field">
            <label htmlFor="service-details">
              Service Details
            </label>

            <textarea
              id="service-details"
              value={details}
              onChange={(event) =>
                setDetails(event.target.value)
              }
              placeholder={service.placeholder}
              rows="5"
            />
          </div>

          {error && (
            <div className="service-form-message error">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="service-form-message success">
              <CheckCircle2 size={17} />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            className="service-purchase-submit"
            disabled={submitting || loading}
          >
            {submitting ? (
              <>
                <LoaderCircle
                  size={17}
                  className="service-spinner"
                />
                Processing...
              </>
            ) : (
              "Submit Purchase"
            )}
          </button>
        </form>

      </div>
    </main>
  );
}
