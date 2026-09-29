import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingBag,
  Clock3,
  CheckCircle2,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";

import { getOrders } from "../../services/api";
import "./AdminOrders.css";

function formatMoney(value) {
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
  return String(status || "pending").toLowerCase();
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const result = await getOrders();
      setOrders(Array.isArray(result?.orders) ? result.orders : []);
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter =
        filter === "all" ||
        String(order.status || "").toLowerCase() === filter;

      if (!matchesFilter) return false;

      if (!query) return true;

      return [
        order.id,
        order.service,
        order.serviceName,
        order.email,
        order.customer,
        order.customerName,
        order.details,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    });
  }, [orders, search, filter]);

  const stats = useMemo(() => {
    const pending = orders.filter(
      (order) =>
        String(order.status || "").toLowerCase() === "pending"
    ).length;

    const completed = orders.filter((order) =>
      ["completed", "success", "successful", "confirmed"].includes(
        String(order.status || "").toLowerCase()
      )
    ).length;

    const volume = orders.reduce(
      (total, order) =>
        total + Number(order.amount || 0),
      0
    );

    return {
      total: orders.length,
      pending,
      completed,
      volume,
    };
  }, [orders]);

  return (
    <section className="admin-orders">
      <div className="admin-orders-header">
        <div>
          <span className="admin-section-kicker">
            Order Management
          </span>

          <h2>Orders</h2>

          <p>
            View and manage customer service orders.
          </p>
        </div>

        <button
          type="button"
          className="admin-orders-refresh"
          onClick={loadOrders}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="admin-orders-stats">
        <div className="admin-orders-stat">
          <div className="admin-orders-stat-icon">
            <ShoppingBag size={19} />
          </div>

          <div>
            <span>Total Orders</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="admin-orders-stat">
          <div className="admin-orders-stat-icon pending">
            <Clock3 size={19} />
          </div>

          <div>
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </div>
        </div>

        <div className="admin-orders-stat">
          <div className="admin-orders-stat-icon success">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <span>Completed</span>
            <strong>{stats.completed}</strong>
          </div>
        </div>

        <div className="admin-orders-stat">
          <div className="admin-orders-stat-icon volume">
            <ShoppingBag size={19} />
          </div>

          <div>
            <span>Order Volume</span>
            <strong>{formatMoney(stats.volume)}</strong>
          </div>
        </div>
      </div>

      <div className="admin-orders-toolbar">
        <div className="admin-orders-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="admin-orders-filters">
          {["all", "pending", "completed"].map(
            (item) => (
              <button
                key={item}
                type="button"
                className={
                  filter === item ? "active" : ""
                }
                onClick={() => setFilter(item)}
              >
                {item === "all"
                  ? "All"
                  : item === "pending"
                    ? "Pending"
                    : "Completed"}
              </button>
            )
          )}
        </div>
      </div>

      {error && (
        <div className="admin-orders-error">
          {error}
        </div>
      )}

      <div className="admin-orders-card">
        <div className="admin-orders-table-wrap">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="admin-orders-empty"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="admin-orders-empty"
                  >
                    <ShoppingBag size={32} />
                    <strong>No orders found</strong>
                    <span>
                      Customer orders will appear here.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="admin-order-id">
                        {order.id || "—"}
                      </div>
                    </td>

                    <td>
                      <div className="admin-order-service">
                        {order.serviceName ||
                          order.service ||
                          "Service"}
                      </div>
                    </td>

                    <td>
                      <strong>
                        {formatMoney(order.amount)}
                      </strong>
                    </td>

                    <td>
                      {formatDate(order.createdAt)}
                    </td>

                    <td>
                      <span
                        className={`admin-order-status ${statusClass(
                          order.status
                        )}`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-order-view"
                        onClick={() =>
                          setSelectedOrder(order)
                        }
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div
          className="admin-order-modal-backdrop"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="admin-order-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-order-modal-header">
              <div>
                <span>Order Details</span>
                <h3>
                  {selectedOrder.id || "Order"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-order-details">
              <div>
                <span>Service</span>
                <strong>
                  {selectedOrder.serviceName ||
                    selectedOrder.service ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>Amount</span>
                <strong>
                  {formatMoney(selectedOrder.amount)}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {selectedOrder.status || "Pending"}
                </strong>
              </div>

              <div>
                <span>Created</span>
                <strong>
                  {formatDate(
                    selectedOrder.createdAt
                  )}
                </strong>
              </div>

              <div>
                <span>Customer</span>
                <strong>
                  {selectedOrder.customerName ||
                    selectedOrder.customer ||
                    selectedOrder.email ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>Details</span>
                <strong>
                  {selectedOrder.details || "—"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
