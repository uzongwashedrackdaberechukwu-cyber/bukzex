import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  WalletCards,
  ShoppingBag,
  Layers3,
  ArrowLeftRight,
  Bitcoin,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import {
  getSession,
  logoutUser,
  getRegisteredUsers,
} from "../../services/auth";

import {
  getDeposits,
  getOrders,
} from "../../services/api";

import AdminCustomers from "./AdminCustomers";
import AdminDeposits from "./AdminDeposits";
import AdminOrders from "./AdminOrders";
import AdminServices from "./AdminServices";
import AdminTransactions from "./AdminTransactions";
import AdminCrypto from "./AdminCrypto";
import AdminSettings from "./AdminSettings";

import "./AdminDashboard.css";

const navigation = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
  },
  {
    id: "deposits",
    label: "Deposits",
    icon: WalletCards,
  },
  {
    id: "orders",
    label: "Orders",
    icon: ShoppingBag,
  },
  {
    id: "services",
    label: "Services",
    icon: Layers3,
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
  },
  {
    id: "crypto",
    label: "Crypto",
    icon: Bitcoin,
  },
];

function formatAmount(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();

  if (
    value.includes("complete") ||
    value.includes("confirm") ||
    value.includes("success")
  ) {
    return "admin-status-success";
  }

  if (
    value.includes("fail") ||
    value.includes("reject")
  ) {
    return "admin-status-danger";
  }

  return "admin-status-pending";
}

function Status({ status }) {
  const value = String(status || "").toLowerCase();

  const Icon =
    value.includes("complete") ||
    value.includes("confirm") ||
    value.includes("success")
      ? CheckCircle2
      : value.includes("fail") ||
          value.includes("reject")
        ? AlertCircle
        : Clock3;

  return (
    <span className={`admin-status ${statusClass(status)}`}>
      <Icon size={13} />
      {status || "Pending"}
    </span>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState("overview");

  const [customers, setCustomers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [orders, setOrders] = useState([]);
  const [overviewLoading, setOverviewLoading] =
    useState(true);

  async function loadOverview() {
    try {
      setOverviewLoading(true);

      const [depositResult, orderResult, customerResult] =
        await Promise.all([
          getDeposits(),
          getOrders(),
          getRegisteredUsers(),
        ]);

      setCustomers(
        customerResult.filter(
          (user) => user.role !== "admin"
        )
      );

      setDeposits(
        Array.isArray(depositResult?.deposits)
          ? depositResult.deposits
          : []
      );

      setOrders(
        Array.isArray(orderResult?.orders)
          ? orderResult.orders
          : []
      );
    } catch (error) {
      console.error(
        "Unable to load admin overview:",
        error
      );

      setCustomers([]);
    } finally {
      setOverviewLoading(false);
    }
  }

  useEffect(() => {
    getSession().then(setSession).catch(() => setSession(null));
    loadOverview();
  }, []);

  async function handleLogout() {
    await logoutUser();
    navigate("/login", { replace: true });
  }

  function selectSection(section) {
    setActiveSection(section);
    setMobileOpen(false);
  }

  const activeLabel =
    navigation.find(
      (item) => item.id === activeSection
    )?.label || "Overview";

  const pendingDeposits = deposits.filter(
    (deposit) =>
      String(deposit.status || "").toLowerCase() ===
      "pending"
  );

  const transactionVolume =
    deposits.reduce(
      (total, deposit) =>
        total + Number(deposit.amount || 0),
      0
    ) +
    orders.reduce(
      (total, order) =>
        total + Number(order.amount || 0),
      0
    );

  const recentDeposits = deposits.slice(0, 5);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="admin-page">
      {mobileOpen && (
        <button
          type="button"
          className="admin-mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Close admin menu"
        />
      )}

      <aside
        className={`admin-sidebar ${
          mobileOpen ? "admin-sidebar-open" : ""
        }`}
      >
        <div className="admin-sidebar-top">
          <div className="admin-brand">
            <span className="admin-brand-mark">
              B
            </span>

            <div>
              <strong>
                Bukz<span>Ex</span>
              </strong>
              <small>ADMIN PANEL</small>
            </div>
          </div>

          <button
            type="button"
            className="admin-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close admin menu"
          >
            <X size={20} />
          </button>

          <nav className="admin-navigation">
            <small>MAIN MENU</small>

            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-nav-link ${
                    activeSection === item.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    selectSection(item.id)
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="admin-nav-link admin-settings-link"
            onClick={() => selectSection("settings")}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <button
            type="button"
            className="admin-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-menu-button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open admin menu"
            >
              <Menu size={20} />
            </button>

            <div>
              <span className="admin-topbar-label">
                ADMINISTRATION
              </span>

              <h1>{activeLabel}</h1>
            </div>
          </div>

          <div className="admin-user">
            <div className="admin-user-avatar">
              {session?.firstName?.charAt(0) || "A"}
            </div>

            <div>
              <strong>
                {session?.firstName
                  ? `${session.firstName} ${
                      session.lastName || ""
                    }`.trim()
                  : "BukzEx Admin"}
              </strong>
              <small>Administrator</small>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {activeSection === "overview" && (
            <>
              <section className="admin-welcome">
                <div>
                  <span>WELCOME BACK</span>

                  <h2>Admin Dashboard</h2>

                  <p>
                    Monitor BukzEx activity and manage
                    the platform from one place.
                  </p>
                </div>

                <div className="admin-welcome-icon">
                  <TrendingUp size={25} />
                </div>
              </section>

              <section className="admin-stats">
                <article className="admin-stat-card">
                  <div className="admin-stat-icon blue">
                    <Users size={19} />
                  </div>

                  <div>
                    <span>Total Customers</span>

                    <strong>
                      {overviewLoading
                        ? "..."
                        : customers.length}
                    </strong>

                    <small>
                      <ArrowUpRight size={12} />
                      Registered customers
                    </small>
                  </div>
                </article>

                <article className="admin-stat-card">
                  <div className="admin-stat-icon gold">
                    <WalletCards size={19} />
                  </div>

                  <div>
                    <span>Pending Deposits</span>

                    <strong>
                      {overviewLoading
                        ? "..."
                        : pendingDeposits.length}
                    </strong>

                    <small>
                      <Clock3 size={12} />
                      Awaiting verification
                    </small>
                  </div>
                </article>

                <article className="admin-stat-card">
                  <div className="admin-stat-icon green">
                    <ShoppingBag size={19} />
                  </div>

                  <div>
                    <span>Total Orders</span>

                    <strong>
                      {overviewLoading
                        ? "..."
                        : orders.length}
                    </strong>

                    <small>
                      <ArrowUpRight size={12} />
                      Customer orders
                    </small>
                  </div>
                </article>

                <article className="admin-stat-card">
                  <div className="admin-stat-icon purple">
                    <ArrowLeftRight size={19} />
                  </div>

                  <div>
                    <span>Transaction Volume</span>

                    <strong>
                      {overviewLoading
                        ? "..."
                        : formatAmount(
                            transactionVolume
                          )}
                    </strong>

                    <small>
                      <ArrowUpRight size={12} />
                      Deposits + purchases
                    </small>
                  </div>
                </article>
              </section>

              <section className="admin-panels">
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <div>
                      <span>WALLET ACTIVITY</span>
                      <h3>Recent Deposits</h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        selectSection("deposits")
                      }
                    >
                      View All
                    </button>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Reference</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {overviewLoading ? (
                          <tr>
                            <td colSpan="4">
                              Loading deposits...
                            </td>
                          </tr>
                        ) : recentDeposits.length ===
                          0 ? (
                          <tr>
                            <td colSpan="4">
                              No deposits yet.
                            </td>
                          </tr>
                        ) : (
                          recentDeposits.map(
                            (deposit) => (
                              <tr key={deposit.id}>
                                <td>
                                  {deposit.customerName ||
                                    deposit.customer ||
                                    deposit.email ||
                                    "Customer"}
                                </td>

                                <td>
                                  {deposit.reference ||
                                    deposit.id ||
                                    "—"}
                                </td>

                                <td>
                                  {formatAmount(
                                    deposit.amount
                                  )}
                                </td>

                                <td>
                                  <Status
                                    status={
                                      deposit.status
                                    }
                                  />
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <div>
                      <span>ORDER ACTIVITY</span>
                      <h3>Recent Orders</h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        selectSection("orders")
                      }
                    >
                      View All
                    </button>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Service</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {overviewLoading ? (
                          <tr>
                            <td colSpan="4">
                              Loading orders...
                            </td>
                          </tr>
                        ) : recentOrders.length ===
                          0 ? (
                          <tr>
                            <td colSpan="4">
                              No orders yet.
                            </td>
                          </tr>
                        ) : (
                          recentOrders.map(
                            (order) => (
                              <tr key={order.id}>
                                <td>
                                  {order.customerName ||
                                    order.customer ||
                                    order.email ||
                                    "Customer"}
                                </td>

                                <td>
                                  {order.serviceName ||
                                    order.service ||
                                    "Service"}
                                </td>

                                <td>
                                  {formatAmount(
                                    order.amount
                                  )}
                                </td>

                                <td>
                                  <Status
                                    status={
                                      order.status
                                    }
                                  />
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
</>
          )}

          {activeSection === "customers" && (
            <AdminCustomers />
          )}

          {activeSection === "deposits" && (
            <AdminDeposits />
          )}

          {activeSection === "orders" && (
            <AdminOrders />
          )}

          {activeSection === "services" && (
            <AdminServices />
          )}

          {activeSection === "transactions" && (
            <AdminTransactions />
          )}
          {activeSection === "crypto" && (
            <AdminCrypto />
          )}

          {activeSection === "settings" && (
            <AdminSettings />
          )}
        </div>
      </main>
    </div>
  );
}
