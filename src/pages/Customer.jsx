import {
  Layers3,
  ShoppingBag,
  LogOut,
  Bell,
  Menu,
  X,
  WalletCards,
  ArrowRight,
  ArrowLeft,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Plus,
  Smartphone,
  Receipt,
  Store,
  MessageSquareCode,
  TrendingUp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getWalletBalance,
  getOrders,
  createDeposit,
  getDepositStatus,
} from "../services/api";
import { getSession, logoutUser } from "../services/auth";
import WhatsAppSupport from "../components/WhatsAppSupport";

import "./Customer.css";

const serviceLinks = [
  { id: "vtu", name: "Airtime & data", detail: "Stay connected", icon: Smartphone, tone: "blue" },
  { id: "bills", name: "Bills", detail: "Electricity & TV", icon: Receipt, tone: "gold" },
  { id: "marketplace", name: "Digital plans", detail: "Streaming & more", icon: Store, tone: "violet" },
  { id: "sms", name: "Virtual numbers", detail: "SMS & verification", icon: MessageSquareCode, tone: "mint" },
  { id: "social", name: "Social boost", detail: "Grow your reach", icon: TrendingUp, tone: "coral" },
];

function formatAmount(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function getStatusIcon(status) {
  const value = String(status || "").toLowerCase();

  if (
    value.includes("complete") ||
    value.includes("success")
  ) {
    return <CheckCircle2 size={15} />;
  }

  if (
    value.includes("fail") ||
    value.includes("cancel")
  ) {
    return <AlertCircle size={15} />;
  }

  return <Clock3 size={15} />;
}

function getStatusClass(status) {
  const value = String(status || "pending").toLowerCase();

  if (
    value.includes("complete") ||
    value.includes("success")
  ) {
    return "success";
  }

  if (
    value.includes("fail") ||
    value.includes("cancel")
  ) {
    return "failed";
  }

  return "pending";
}

export default function Customer() {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [error, setError] = useState("");
  const [funding, setFunding] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositReference, setDepositReference] = useState("");
  const [depositId, setDepositId] = useState("");
  const [depositStatus, setDepositStatus] = useState("");
  const [depositMessage, setDepositMessage] = useState("");
  const [topUpOpen, setTopUpOpen] = useState(false);

  useEffect(() => {
    getSession().then(setSession).catch((err) => {
      setError(err?.message || "Unable to load your account.");
    });

    async function loadDashboard() {
      try {
        setError("");

        const [walletResult, ordersResult] =
          await Promise.all([
            getWalletBalance(),
            getOrders(),
          ]);

        setWalletBalance(
          Number(
            walletResult?.balance ??
              walletResult?.walletBalance ??
              0
          )
        );

        const orderData = Array.isArray(ordersResult)
          ? ordersResult
          : ordersResult?.orders ||
            ordersResult?.data ||
            [];

        setOrders(
          Array.isArray(orderData)
            ? orderData.slice(0, 5)
            : []
        );
      } catch (err) {
        setError(
          err?.message ||
            "Some dashboard information could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  useEffect(() => {
    if (!depositId || depositStatus !== "pending") return undefined;
    let active = true;
    const checkDeposit = async () => {
      try {
        const result = await getDepositStatus(depositId);
        if (!active) return;
        if (result.status === "confirmed") {
          setDepositStatus("confirmed");
          setDepositMessage("Your deposit was reviewed and your wallet has been credited.");
          const wallet = await getWalletBalance();
          if (active) setWalletBalance(Number(wallet.balance || 0));
        } else if (result.status === "rejected") {
          setDepositStatus("rejected");
          setDepositMessage("The deposit could not be confirmed. Please contact support.");
        }
      } catch {
        // Keep the request pending while the network is unavailable.
      }
    };
    checkDeposit();
    const timer = setInterval(checkDeposit, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [depositId, depositStatus]);

  async function handleDepositSubmit(event) {
    event.preventDefault();

    setError("");
    setDepositMessage("");

    const amount = Number(depositAmount);

    if (!amount || amount <= 0) {
      setError("Enter the amount you transferred.");
      return;
    }

    if (!depositReference.trim()) {
      setError("Enter your transfer reference.");
      return;
    }

    try {
      setFunding(true);

      const result = await createDeposit(
        depositReference.trim(),
        amount
      );

      setDepositId(result.id);
      setDepositStatus("pending");
      setDepositMessage(
        "Deposit submitted. Waiting for confirmation."
      );
      setDepositAmount("");
      setDepositReference("");
    } catch (err) {
      setError(
        err?.message ||
          "Unable to submit the deposit."
      );
    } finally {
      setFunding(false);
    }
  }

  async function handleLogout() {
    await logoutUser();
    navigate("/login", { replace: true });
  }

  const firstName = session?.firstName || "Customer";
  const fullName =
    [session?.firstName, session?.lastName]
      .filter(Boolean)
      .join(" ") || "Customer";

  return (
    <div className="customer-page">
      <header className="customer-topbar">
        <Link to="/customer" className="customer-logo" aria-label="BukzEx dashboard">
          <span className="customer-logo-mark">B</span>
          <span>Bukz<span>Ex</span></span>
        </Link>
        <nav className={`customer-topnav ${mobileOpen ? "is-open" : ""}`} aria-label="Customer navigation">
          <Link to="/customer" onClick={() => setMobileOpen(false)} className="is-current">Home</Link>
          <Link to="/customer/services" onClick={() => setMobileOpen(false)}>Services</Link>
          <Link to="/customer/orders" onClick={() => setMobileOpen(false)}>My purchases</Link>
          <Link to="/customer/profile" onClick={() => setMobileOpen(false)}>Profile</Link>
        </nav>
        <div className="customer-topbar-actions">
          <button type="button" className="customer-notification" aria-label="Notifications"><Bell size={18} /></button>
          <Link to="/customer/profile" className="customer-user" aria-label={`Open ${fullName}'s profile`}>
            <span className="customer-user-avatar">{firstName.charAt(0).toUpperCase()}</span>
            <span className="customer-user-info"><strong>{firstName}</strong><small>My account</small></span>
          </Link>
          <button type="button" className="customer-menu-button" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close menu" : "Open menu"}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <main className="customer-content">

          {topUpOpen ? (
            <>
              <button
                type="button"
                className="customer-topup-back"
                onClick={() => setTopUpOpen(false)}
              >
                <ArrowLeft size={17} /> Back to dashboard
              </button>

              <section id="fund-wallet" className="customer-funding-section customer-topup-page">
                <div className="customer-section-heading">
                  <div>
                    <span className="customer-topup-eyebrow">WALLET FUNDING</span>
                    <h1>Top up your wallet</h1>
                    <p>Transfer funds using the details below, then submit your transfer reference.</p>
                  </div>
                </div>

                <div className="customer-funding-account">
                  <div><small>BANK</small><strong>OPay</strong></div>
                  <div><small>ACCOUNT NUMBER</small><strong>6402493498</strong></div>
                  <div><small>ACCOUNT NAME</small><strong>MATTHEW CHUKWUEBUKA AGU</strong></div>
                </div>

                <form className="customer-funding-form" onSubmit={handleDepositSubmit}>
                  <div>
                    <label htmlFor="deposit-amount">Transfer Amount</label>
                    <input id="deposit-amount" type="number" min="1" value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} placeholder="Enter amount" disabled={Boolean(depositId)} />
                  </div>
                  <div>
                    <label htmlFor="deposit-reference">Transfer Reference</label>
                    <input id="deposit-reference" type="text" value={depositReference} onChange={(event) => setDepositReference(event.target.value)} placeholder="Enter transfer reference" disabled={Boolean(depositId)} />
                  </div>
                  {!depositId && <button type="submit" disabled={funding} className="customer-funding-submit">{funding ? "Submitting..." : "Submit Deposit"}</button>}
                </form>

                {depositStatus === "pending" && <div className="customer-funding-status pending"><Clock3 size={18} /><div><strong>Deposit Pending</strong><p>Your transfer has been submitted and is waiting for confirmation.</p></div><span>Awaiting administrator review</span></div>}
                {depositStatus === "confirmed" && <div className="customer-funding-status confirmed"><CheckCircle2 size={18} /><div><strong>Deposit Confirmed</strong><p>{depositMessage}</p></div></div>}
                {depositStatus === "rejected" && <div className="customer-funding-status pending" role="status"><AlertCircle size={18} /><div><strong>Deposit Not Confirmed</strong><p>{depositMessage}</p></div></div>}
                {error && <div className="customer-funding-error"><AlertCircle size={17} /><span>{error}</span></div>}
                {!depositStatus && !error && <div className="customer-funding-note">Deposits remain pending until an administrator verifies the transfer and confirms it.</div>}
              </section>
            </>
          ) : (
          <>

          <section className="customer-welcome">
            <div className="customer-welcome-copy">
              <span className="customer-welcome-kicker"><i /> YOUR BUKZEX ACCOUNT</span>
              <h1>Your digital life,<br /><em>made effortless.</em></h1>
              <p>Welcome back, {firstName}. Top up, pay bills and find the digital services you need, all from one secure account.</p>
              <div className="customer-welcome-actions">
                <Link to="/customer/services" className="customer-primary-action">Explore services <ArrowRight size={17} /></Link>
                <button type="button" className="customer-secondary-action" onClick={() => { setDepositStatus(""); setDepositMessage(""); setError(""); setTopUpOpen(true); }}>Top up wallet <Plus size={16} /></button>
              </div>
              <div className="customer-trust-row"><span><ShieldCheck size={15} /> Secure wallet</span><span><Sparkles size={15} /> All your services</span></div>
            </div>
            <div className="customer-welcome-art" aria-label="BukzEx services at a glance">
              <div className="customer-art-glow" />
              <div className="customer-art-screen">
                <div className="customer-art-screen-top"><span className="customer-art-logo">B</span><span>BUKZEX</span><span className="customer-art-online"><i /> LIVE</span></div>
                <div className="customer-art-feature"><span>YOUR DIGITAL LIFE</span><strong>Everything you need,<br />one simple place.</strong><small>Secure. Quick. Convenient.</small></div>
                <div className="customer-art-services">
                  {serviceLinks.slice(0, 3).map((service) => { const Icon = service.icon; return <div key={service.id}><span className={`customer-art-service-icon ${service.tone}`}><Icon size={17} /></span><strong>{service.id === "vtu" ? "VTU" : service.id === "bills" ? "Bills" : "Digital"}</strong></div>; })}
                </div>
              </div>
              <div className="customer-art-float"><WalletCards size={18} /><span>WALLET READY</span><strong>{loading ? "Loading" : formatAmount(walletBalance)}</strong></div>
            </div>
          </section>

          {error && (
            <div className="customer-dashboard-error">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <section className="customer-dashboard-grid">

            <div className="customer-dashboard-card wallet-card">
              <div className="customer-wallet-card-top">
                <div className="customer-wallet-brand">
                  <span className="customer-wallet-chip" aria-hidden="true" />
                  <span>BUKZEX WALLET</span>
                </div>
                <WalletCards size={22} aria-hidden="true" />
              </div>

              <div className="customer-wallet-balance-label">AVAILABLE BALANCE</div>
              <strong className="customer-wallet-balance">
                {loading
                  ? "Loading..."
                  : formatAmount(walletBalance)}
              </strong>

              <div className="customer-wallet-card-bottom">
                <span>Secure digital wallet</span>
                <button
                  type="button"
                  onClick={() => {
                    setDepositStatus("");
                    setDepositMessage("");
                    setError("");
                    setTopUpOpen(true);
                  }}
                >
                  Top up wallet <Plus size={15} />
                </button>
              </div>
            </div>

            <div className="customer-dashboard-card customer-shortcut-card">
              <div className="customer-dashboard-card-top">
                <div className="customer-dashboard-card-icon">
                  <ShoppingBag size={19} />
                </div>

                <span>ORDERS</span>
              </div>

              <strong>{orders.length}</strong>

              <Link to="/customer/orders">
                View Orders
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="customer-dashboard-card customer-shortcut-card">
              <div className="customer-dashboard-card-top">
                <div className="customer-dashboard-card-icon">
                  <Layers3 size={19} />
                </div>

                <span>PAYMENTS · ORDERS · STACK</span>
              </div>

              <strong className="customer-stack-value">My purchases</strong>

              <Link to="/customer/orders">
                View payment stack
                <ArrowRight size={14} />
              </Link>
            </div>

          </section>

          <section className="customer-service-preview">
            <div className="customer-section-heading">
              <div><span className="customer-section-kicker">ONE ACCOUNT · MORE POSSIBILITIES</span><h2>What do you need today?</h2><p>Choose a service to see live options and prices.</p></div>
              <Link to="/customer/services" className="customer-view-all">View all services <ArrowRight size={16} /></Link>
            </div>
            <div className="customer-service-preview-grid">
              {serviceLinks.map((service) => { const Icon = service.icon; return <Link to={`/customer/services/${service.id}`} key={service.id} className={`customer-service-preview-card tone-${service.tone}`}><span className="customer-preview-icon"><Icon size={21} /></span><span className="customer-preview-copy"><strong>{service.name}</strong><small>{service.detail}</small></span><ArrowRight className="customer-preview-arrow" size={17} /></Link>; })}
            </div>
          </section>

          <section className="customer-recent-section">

            <div className="customer-section-heading">
              <div>
                <h2>Recent Orders</h2>
                <p>Your latest service activity.</p>
              </div>

              <Link to="/customer/orders">
                View All
              </Link>
            </div>

            {loading ? (
              <div className="customer-recent-empty">
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="customer-recent-empty">
                <ShoppingBag size={24} />

                <h3>No orders yet</h3>

                <p>
                  Your service purchases will appear here.
                </p>

                <Link to="/customer/services">
                  Browse Services
                </Link>
              </div>
            ) : (
              <div className="customer-recent-list">
                {orders.map((order, index) => {
                  const status =
                    order.status || "pending";

                  return (
                    <div
                      className="customer-recent-order"
                      key={
                        order.id ||
                        order.orderId ||
                        index
                      }
                    >
                      <div className="customer-recent-order-icon">
                        <ShoppingBag size={17} />
                      </div>

                      <div className="customer-recent-order-info">
                        <strong>
                          {order.serviceName ||
                            order.service ||
                            "Service Order"}
                        </strong>

                        <small>
                          {order.id ||
                            order.orderId ||
                            "Order"}
                        </small>
                      </div>

                      <strong className="customer-recent-amount">
                        {formatAmount(order.amount)}
                      </strong>

                      <span
                        className={`customer-recent-status ${getStatusClass(
                          status
                        )}`}
                      >
                        {getStatusIcon(status)}
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

          </section>
          </>
          )}

        </main>
        <footer className="customer-footer"><span>BUKZEX</span><small>Your digital world, made simpler.</small><button type="button" onClick={handleLogout}><LogOut size={15} /> Sign out</button></footer>
        <WhatsAppSupport />
    </div>
  );
}
