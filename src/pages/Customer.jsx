import {
  LayoutDashboard,
  Layers3,
  ShoppingBag,
  UserRound,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  WalletCards,
  ArrowRight,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Plus,
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

import "./Customer.css";

const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/customer",
  },
  {
    label: "Services",
    icon: Layers3,
    path: "/customer/services",
  },
  {
    label: "My Orders",
    icon: ShoppingBag,
    path: "/customer/orders",
  },
];

const accountNavigation = [
  {
    label: "Profile",
    icon: UserRound,
    path: "/customer/profile",
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/customer/settings",
  },
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

      {mobileOpen && (
        <button
          type="button"
          className="customer-mobile-overlay"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`customer-sidebar ${
          mobileOpen ? "customer-sidebar-open" : ""
        }`}
      >
        <div className="customer-sidebar-top">

          <Link
            to="/customer"
            className="customer-logo"
            onClick={() => setMobileOpen(false)}
          >
            <span className="customer-logo-mark">B</span>
            <span>
              Bukz<span>Ex</span>
            </span>
          </Link>

          <button
            type="button"
            className="customer-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={21} />
          </button>

          <nav className="customer-nav">
            <div className="customer-nav-section">
              <small>MAIN</small>

              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={
                      item.path === "/customer"
                        ? "customer-nav-link active"
                        : "customer-nav-link"
                    }
                    onClick={() =>
                      setMobileOpen(false)
                    }
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="customer-nav-section">
              <small>ACCOUNT</small>

              {accountNavigation.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="customer-nav-link"
                    onClick={() =>
                      setMobileOpen(false)
                    }
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="customer-sidebar-bottom">
          <div className="customer-sidebar-wallet">
            <div className="customer-sidebar-wallet-icon">
              <WalletCards size={17} />
            </div>

            <div>
              <small>WALLET BALANCE</small>
              <strong>
                {formatAmount(walletBalance)}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="customer-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <section className="customer-main">

        <header className="customer-topbar">
          <button
            type="button"
            className="customer-menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>

          <div className="customer-topbar-spacer" />

          <button
            type="button"
            className="customer-notification"
            aria-label="Notifications"
          >
            <Bell size={19} />
          </button>

          <Link
            to="/customer/profile"
            className="customer-user"
          >
            <div className="customer-user-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>

            <div className="customer-user-info">
              <strong>{fullName}</strong>
              <small>Customer</small>
            </div>
          </Link>
        </header>

        <main className="customer-content">

          <section className="customer-welcome">
            <div>
              <span>BUKZEX DASHBOARD</span>

              <h1>
                Welcome back, {firstName}.
              </h1>

              <p>
                Manage your wallet, services and orders
                from one place.
              </p>
            </div>

            <Link
              to="/customer/services"
              className="customer-primary-action"
            >
              Browse Services
              <ArrowRight size={16} />
            </Link>
          </section>

          {error && (
            <div className="customer-dashboard-error">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <section className="customer-dashboard-grid">

            <div className="customer-dashboard-card wallet-card">
              <div className="customer-dashboard-card-top">
                <div className="customer-dashboard-card-icon">
                  <WalletCards size={19} />
                </div>

                <span>WALLET</span>
              </div>

              <strong>
                {loading
                  ? "Loading..."
                  : formatAmount(walletBalance)}
              </strong>

              <button
                type="button"
                onClick={() => {
                  setDepositStatus("");
                  setDepositMessage("");
                  setError("");
                  document
                    .getElementById("fund-wallet")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });
                }}
              >
                Fund Wallet
                <Plus size={14} />
              </button>
            </div>

            <div className="customer-dashboard-card">
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

            <div className="customer-dashboard-card">
              <div className="customer-dashboard-card-top">
                <div className="customer-dashboard-card-icon">
                  <Layers3 size={19} />
                </div>

                <span>SERVICES</span>
              </div>

              <strong>6</strong>

              <Link to="/customer/services">
                View Services
                <ArrowRight size={14} />
              </Link>
            </div>

          </section>

          <section
            id="fund-wallet"
            className="customer-funding-section"
          >
            <div className="customer-section-heading">
              <div>
                <h2>Fund Wallet</h2>
                <p>
                  Transfer funds to the account below, then submit
                  your transfer reference.
                </p>
              </div>
            </div>

            <div className="customer-funding-account">
              <div>
                <small>BANK</small>
                <strong>OPay</strong>
              </div>

              <div>
                <small>ACCOUNT NUMBER</small>
                <strong>6402493498</strong>
              </div>

              <div>
                <small>ACCOUNT NAME</small>
                <strong>MATTHEW CHUKWUEBUKA AGU</strong>
              </div>
            </div>

            <form
              className="customer-funding-form"
              onSubmit={handleDepositSubmit}
            >
              <div>
                <label htmlFor="deposit-amount">
                  Transfer Amount
                </label>

                <input
                  id="deposit-amount"
                  type="number"
                  min="1"
                  value={depositAmount}
                  onChange={(event) =>
                    setDepositAmount(event.target.value)
                  }
                  placeholder="Enter amount"
                  disabled={Boolean(depositId)}
                />
              </div>

              <div>
                <label htmlFor="deposit-reference">
                  Transfer Reference
                </label>

                <input
                  id="deposit-reference"
                  type="text"
                  value={depositReference}
                  onChange={(event) =>
                    setDepositReference(event.target.value)
                  }
                  placeholder="Enter transfer reference"
                  disabled={Boolean(depositId)}
                />
              </div>

              {!depositId && (
                <button
                  type="submit"
                  disabled={funding}
                  className="customer-funding-submit"
                >
                  {funding
                    ? "Submitting..."
                    : "Submit Deposit"}
                </button>
              )}
            </form>

            {depositStatus === "pending" && (
              <div className="customer-funding-status pending">
                <Clock3 size={18} />

                <div>
                  <strong>Deposit Pending</strong>
                  <p>
                    Your transfer has been submitted and is waiting
                    for confirmation.
                  </p>
                </div>

                <span>Awaiting administrator review</span>
              </div>
            )}

            {depositStatus === "confirmed" && (
              <div className="customer-funding-status confirmed">
                <CheckCircle2 size={18} />

                <div>
                  <strong>Deposit Confirmed</strong>
                  <p>
                    {depositMessage}
                  </p>
                </div>
              </div>
            )}

            {depositStatus === "rejected" && (
              <div className="customer-funding-status pending" role="status">
                <AlertCircle size={18} />
                <div>
                  <strong>Deposit Not Confirmed</strong>
                  <p>{depositMessage}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="customer-funding-error">
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}

            {!depositStatus && !error && (
              <div className="customer-funding-note">
                Deposits remain pending until an administrator verifies the transfer and confirms it.
              </div>
            )}
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

        </main>
      </section>
    </div>
  );
}
