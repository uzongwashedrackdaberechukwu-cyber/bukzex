import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingBag,
  Clock3,
  CheckCircle2,
  RefreshCw,
  Eye,
  X,
  Trash2,
  XCircle,
} from "lucide-react";

import { cancelAdminOrder, deleteOrder, getOrders, updateOrder } from "../../services/api";
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

function isUnpaidAndRemovable(order) {
  const status = String(order?.status || "").toLowerCase();
  const paymentStatus = String(order?.payment_status || "").toLowerCase();
  return ["pending", "rejected", "failed"].includes(status)
    && (!paymentStatus || ["unpaid", "failed", "rejected"].includes(paymentStatus));
}

function canCancelOrder(order) {
  const status = String(order?.status || "").toLowerCase();
  if (["completed", "success", "successful", "fulfilled", "refunded", "cancelled", "canceled"].includes(status)) return false;
  if (order?.provider === "ShadexGoLtd") {
    return Boolean(order.supplier_order_id)
      && ["sms", "email_verification"].includes(String(order.service_key || ""))
      && ["pending", "processing", "active", "waiting", "allocating"].includes(status);
  }
  const paymentStatus = String(order?.payment_status || "").toLowerCase();
  return status === "pending" && (!paymentStatus || ["unpaid", "failed", "rejected"].includes(paymentStatus));
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  async function handleStatusChange(status) {
    if (!selectedOrder) return;
    try {
      setUpdating(true);
      setError("");
      await updateOrder(selectedOrder.id, status);
      setSelectedOrder(null);
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to update this order.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleCancel(order) {
    if (!order?.id || !canCancelOrder(order)) return;
    const supplierOrder = order.provider === "ShadexGoLtd";
    const message = supplierOrder
      ? "Request cancellation from ShadexGoLtd? BukzEx will only refund your customer after the supplier confirms the cancellation and refund."
      : "Cancel this unpaid pending order? No wallet refund is needed because no payment was taken.";
    if (!window.confirm(message)) return;

    try {
      setCancelling(true);
      setError("");
      await cancelAdminOrder(order.id, "Cancelled by administrator from BukzEx admin.");
      setSelectedOrder(null);
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to safely cancel this order.");
    } finally {
      setCancelling(false);
    }
  }

  async function handleDelete(order) {
    if (!order?.id || !isUnpaidAndRemovable(order)) return;
    const approved = window.confirm(
      "Permanently delete this rejected or unpaid order? Its order record will be removed."
    );
    if (!approved) return;
    try {
      setDeleting(true);
      setError("");
      await deleteOrder(order.id);
      setSelectedOrder(null);
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to delete this order.");
    } finally {
      setDeleting(false);
    }
  }

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
        order.user_id,
        order.provider,
        order.supplier_order_id,
        order.payment_status,
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
        ["pending", "processing", "waiting", "allocating"].includes(String(order.status || "").toLowerCase())
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
            <span>Pending / Processing</span>
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
          {["all", "pending", "processing", "completed", "failed", "cancelled", "rejected"].map(
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
                    : item === "processing"
                      ? "Processing"
                      : item === "failed"
                        ? "Failed"
                        : item === "cancelled"
                          ? "Cancelled"
                          : item === "rejected"
                            ? "Rejected"
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
                      <div className="admin-order-row-actions">
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
                      {canCancelOrder(order) && (
                        <button
                          type="button"
                          className="admin-order-cancel"
                          onClick={() => handleCancel(order)}
                          disabled={cancelling || updating || deleting}
                        >
                          <XCircle size={15} /> Cancel
                        </button>
                      )}
                      {isUnpaidAndRemovable(order) && (
                        <button
                          type="button"
                          className="admin-order-delete"
                          onClick={() => handleDelete(order)}
                          disabled={deleting}
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      )}
                      </div>
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
              <div>
                <span>Provider</span>
                <strong>{selectedOrder.provider || "BukzEx / manual review"}</strong>
              </div>
              <div>
                <span>Payment status</span>
                <strong>{selectedOrder.payment_status || "Not recorded"}</strong>
              </div>
              <div>
                <span>Fulfilment status</span>
                <strong>{selectedOrder.fulfillment_status || "Not recorded"}</strong>
              </div>
              {selectedOrder.supplier_order_id && <div>
                <span>Supplier reference</span>
                <strong>{selectedOrder.supplier_order_id}</strong>
              </div>}
              {selectedOrder.user_id && <div>
                <span>Customer UID</span>
                <strong>{selectedOrder.user_id}</strong>
              </div>}
            </div>
            {error && <div className="admin-orders-error" role="alert">{error}</div>}
            {selectedOrder.status === "pending" && (
              <div className="admin-order-modal-actions">
                <button type="button" disabled={updating} onClick={() => handleStatusChange("processing")}>Mark Processing</button>
                <button type="button" disabled={updating} onClick={() => handleStatusChange("rejected")}>Reject</button>
              </div>
            )}
            {selectedOrder.status === "processing" && (
              <div className="admin-order-modal-actions">
                <button type="button" disabled={updating} onClick={() => handleStatusChange("completed")}>Mark Completed</button>
              </div>
            )}
            {canCancelOrder(selectedOrder) && (
              <div className="admin-order-modal-actions danger-action">
                <button
                  type="button"
                  disabled={cancelling || updating || deleting}
                  onClick={() => handleCancel(selectedOrder)}
                >
                  <XCircle size={16} />
                  {cancelling ? "Cancelling safely…" : "Cancel order"}
                </button>
              </div>
            )}
            {selectedOrder.provider === "ShadexGoLtd" && !canCancelOrder(selectedOrder)
              && ["pending", "processing", "active", "waiting", "allocating"].includes(String(selectedOrder.status || "").toLowerCase())
              && <p className="admin-order-cancel-note">This supplier service does not expose a safe cancellation endpoint through the current API. BukzEx will not mark it cancelled or refund it without supplier confirmation.</p>}
            {isUnpaidAndRemovable(selectedOrder) && (
              <div className="admin-order-modal-actions danger-action">
                <button
                  type="button"
                  disabled={deleting || updating}
                  onClick={() => handleDelete(selectedOrder)}
                >
                  <Trash2 size={16} />
                  {deleting ? "Deleting…" : "Permanently delete order"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
