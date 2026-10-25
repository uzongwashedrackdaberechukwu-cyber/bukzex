import {
  ArrowLeft,
  ShoppingBag,
  LoaderCircle,
  RefreshCw,
  AlertCircle,
  MessageCircle,
  Trash2,
  Search,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { deleteMyUnpaidOrder, getOrders, refreshDigitalServiceOrder } from "../services/api";
import WhatsAppSupport from "../components/WhatsAppSupport";
import ServiceBrandMark from "../components/ServiceBrandMark";
import CustomerWorkspaceNav from "../components/CustomerWorkspaceNav";

import "./CustomerOrders.css";
import "./CustomerExperience2026.css";

function formatAmount(value) {
  const amount = Number(value || 0);

  return `₦${amount.toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function getStatusClass(status) {
  const value = String(status || "pending").toLowerCase();

  if (
    value.includes("complete") ||
    value.includes("success") ||
    value === "completed" ||
    value === "active"
  ) {
    return "success";
  }

  if (
    value.includes("fail") ||
    value.includes("cancel") ||
    value.includes("reject") ||
    value.includes("refund") ||
    value.includes("expired") ||
    value === "failed"
  ) {
    return "failed";
  }

  return "pending";
}

function isPaidOrder(order) {
  const states = [order?.payment_status, order?.status, order?.fulfillment_status]
    .map((value) => String(value || "").toLowerCase());
  return states.some((value) => ["paid", "confirmed", "complete", "completed", "success", "successful", "fulfilled", "delivered"].includes(value));
}

function canIssueReceipt(order) {
  const status = String(order?.status || "").toLowerCase();
  const fulfillment = String(order?.fulfillment_status || "").toLowerCase();
  const payment = String(order?.payment_status || "").toLowerCase();
  const blocked = ["failed", "cancelled", "canceled", "refunded", "rejected", "expired"];

  if ([status, fulfillment, payment].some((value) =>
    blocked.some((word) => value.includes(word))
  )) return false;

  const completed = ["completed", "complete", "success", "successful", "fulfilled", "delivered"];
  return completed.includes(status) || completed.includes(fulfillment);
}

function receiptText(order) {
  return [
    "BUKZEX TRANSACTION RECEIPT",
    `Service: ${order.serviceName || order.service || "Service Order"}`,
    `Order reference: ${order.id || order.orderId || "—"}`,
    `Amount: ${formatAmount(order.amount)}`,
    `Date: ${formatDate(order.createdAt || order.created_at || order.date)}`,
    "Status: Completed",
    "BukzEx transaction receipt. Not a bank-issued receipt.",
  ].join("\\n");
}

function printReceipt(order) {
  const text = receiptText(order);
  const popup = window.open("", "_blank");
  if (!popup) {
    window.alert("Allow pop-ups to print or save this receipt as PDF.");
    return;
  }

  const documentRef = popup.document;
  documentRef.title = "BukzEx Transaction Receipt";
  const style = documentRef.createElement("style");
  style.textContent = "body{font-family:Arial,sans-serif;max-width:650px;margin:55px auto;padding:20px;color:#172033}h1{font-size:24px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:16px/2 Arial,sans-serif}.note{font-size:12px;color:#666}";
  documentRef.head.appendChild(style);
  const heading = documentRef.createElement("h1");
  heading.textContent = "BukzEx Transaction Receipt";
  documentRef.body.appendChild(heading);
  const content = documentRef.createElement("pre");
  content.textContent = text;
  documentRef.body.appendChild(content);
  popup.focus();
  popup.print();
}

function canDeleteOrder(order) {
  const status = String(order?.status || "").toLowerCase();
  const paymentStatus = String(order?.payment_status || "").toLowerCase();
  return ["pending", "rejected", "failed"].includes(status)
    && (!paymentStatus || ["unpaid", "failed", "rejected"].includes(paymentStatus));
}

function getServiceEmail(order) {
  return order?.email_address || order?.service_email || order?.serviceEmail ||
    order?.fulfillment?.service_email || order?.credentials?.email || "";
}

function getOtpLink(order) {
  const orderId = order?.id || order?.orderId || "my order";
  const serviceEmail = getServiceEmail(order);
  const message = `Hello BukzEx, please help me request the OTP for order ${orderId}${serviceEmail ? ` (service email: ${serviceEmail})` : ""}.`;
  return `https://wa.me/2349161791736?text=${encodeURIComponent(message)}`;
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const normalizedQuery = orderQuery.trim().toLowerCase();
  const filteredOrders = orders.filter((order) => {
    const statusClass = getStatusClass(order.status || "pending");
    const searchable = [
      order.serviceName, order.service, order.id, order.orderId,
      order.status, order.payment_status, order.service_key,
    ].filter(Boolean).join(" ").toLowerCase();

    return (activeFilter === "all" || statusClass === activeFilter)
      && searchable.includes(normalizedQuery);
  });
  const pendingCount = orders.filter((order) => getStatusClass(order.status || "pending") === "pending").length;
  const completedCount = orders.filter((order) => getStatusClass(order.status || "pending") === "success").length;
  const failedCount = orders.filter((order) => getStatusClass(order.status || "pending") === "failed").length;

  const loadOrders = useCallback(async (manual = false) => {
    try {
      setError("");

      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let result = await getOrders();

      let data = Array.isArray(result)
        ? result
        : result?.orders || result?.data || [];

      const waiting = (Array.isArray(data) ? data : []).filter((order) => {
        if (order?.provider !== "ShadexGoLtd") return false;
        const serviceKey = String(order?.service_key || "");
        const status = String(order?.status || "").toLowerCase();
        const terminal = ["failed", "rejected", "cancelled", "canceled", "refunded", "expired"].includes(status);
        if (terminal) return false;
        const activeWork = ["pending", "processing", "waiting", "allocating"].includes(status);
        const waitingForOtp = ["sms", "email_verification"].includes(serviceKey) && !order?.otp_code;
        const missingDigitalAccount = serviceKey === "marketplace" && !order?.service_email;

        // A marketplace order can be left marked completed locally even when
        // the ShadexGoLtd POST never produced/saved a supplier reference.
        // Refresh it through the saved idempotency key so the Worker can safely
        // submit/reconcile the supplier order without charging twice.
        if (!order?.supplier_order_id) {
          return activeWork || missingDigitalAccount;
        }

        return activeWork || waitingForOtp || missingDigitalAccount;
      });
      if (waiting.length) {
        const refreshResults = await Promise.allSettled(waiting.map((order) => refreshDigitalServiceOrder(order.id)));
        const refreshFailures = refreshResults.filter((item) => item.status === "rejected").length;
        if (refreshFailures) {
          setError(`${refreshFailures} supplier status update${refreshFailures === 1 ? "" : "s"} could not be confirmed. Your order records and wallet history are preserved. BukzEx support may need to check the ShadexGoLtd API read permissions.`);
        }
        result = await getOrders();
        data = Array.isArray(result) ? result : result?.orders || result?.data || [];
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load your orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleDelete(order) {
    const orderId = order?.id || order?.orderId;
    if (!orderId || !canDeleteOrder(order)) return;
    if (!window.confirm("Permanently delete this unpaid service request?")) return;
    try {
      setDeletingId(String(orderId));
      setError("");
      await deleteMyUnpaidOrder(orderId);
      setOrders((current) => current.filter((item) => String(item.id || item.orderId) !== String(orderId)));
    } catch (err) {
      setError(err?.message || "Unable to delete this unpaid request.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <>
      <CustomerWorkspaceNav current="orders" />
      <main className="customer-orders-page">
      <div className="customer-orders-header">
        <div>
          <Link
            to="/customer"
            className="customer-orders-back"
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </Link>

          <span className="customer-orders-eyebrow">ACCOUNT ACTIVITY</span>

          <h1>Purchases &amp; orders</h1>

          <p>
            Track payment, delivery and verification details for your purchases.
          </p>
        </div>

        <div className="customer-orders-header-actions">
          <Link to="/customer/services" className="customer-orders-browse">
            <ShoppingBag size={15} /> Browse services
          </Link>
          <button
            type="button"
            className="customer-orders-refresh"
            onClick={() => loadOrders(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={refreshing ? "customer-orders-spin" : ""}
            />
            Refresh status
          </button>
        </div>
      </div>

      <section className="customer-orders-tools" aria-label="Order overview and filters">
        <div className="customer-orders-stats">
          <div><small>TOTAL</small><strong>{orders.length}</strong></div>
          <div><small>PENDING</small><strong>{pendingCount}</strong></div>
          <div><small>COMPLETED</small><strong>{completedCount}</strong></div>
          <div><small>FAILED / REFUNDED</small><strong>{failedCount}</strong></div>
        </div>
        <label className="customer-orders-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={orderQuery}
            onChange={(event) => setOrderQuery(event.target.value)}
            placeholder="Search service or order ID"
            aria-label="Search purchases"
          />
        </label>
        <div className="customer-orders-filters" aria-label="Filter orders">
          {[
            ["all", "All"],
            ["pending", "Pending"],
            ["success", "Completed"],
            ["failed", "Failed"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={activeFilter === value ? "active" : ""}
              onClick={() => setActiveFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="customer-orders-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="customer-orders-loading">
          <LoaderCircle
            size={28}
            className="customer-orders-spin"
          />
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="customer-orders-empty">
          <div className="customer-orders-empty-icon">
            <ShoppingBag size={25} />
          </div>

            <h2>Your stack is empty</h2>

          <p>
            Your completed and pending purchases will appear here.
          </p>

          <Link
            to="/customer/services"
            className="customer-orders-shop"
          >
            Browse Services
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="customer-orders-empty customer-orders-no-results">
          <div className="customer-orders-empty-icon"><Search size={24} /></div>
          <h2>No matching purchases</h2>
          <p>Try another service name, order reference or status filter.</p>
          <button type="button" className="customer-orders-clear" onClick={() => { setOrderQuery(""); setActiveFilter("all"); }}>Clear filters</button>
        </div>
      ) : (
        <div className="customer-orders-list">
          {filteredOrders.map((order, index) => {
            const status = order.status || "pending";
            const statusClass = getStatusClass(status);

            return (
              <article
                className="customer-order-card"
                key={order.id || order.orderId || index}
              >
                <div className="customer-order-icon">
                  <ServiceBrandMark name={order.serviceName || order.service || "Service"} fallbackIcon={ShoppingBag} size="small" />
                </div>

                <div className="customer-order-main">
                  <div className="customer-order-top">
                    <h2>
                      {order.serviceName ||
                        order.service ||
                        "Service Order"}
                    </h2>

                    <span
                      className={`customer-order-status ${statusClass}`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="customer-order-details">
                    <span>
                      Order ID:{" "}
                      <strong>
                        {order.id ||
                          order.orderId ||
                          "—"}
                      </strong>
                    </span>

                    <span>
                      Amount:{" "}
                      <strong>
                        {formatAmount(order.amount)}
                      </strong>
                    </span>

                    <span>
                      Date:{" "}
                      <strong>
                        {formatDate(
                          order.createdAt ||
                            order.created_at ||
                            order.date
                        )}
                      </strong>
                    </span>
                  </div>

                  {isPaidOrder(order) ? (
                    order.service_key === "email_verification" ? (
                      <div className="customer-order-fulfillment">
                        {order.email_address && <div><small>VERIFICATION EMAIL</small><strong>{order.email_address}</strong></div>}
                        {order.domain_name && <div><small>EMAIL TYPE</small><strong>{order.domain_name}</strong></div>}
                        {order.otp_code && <div><small>VERIFICATION CODE</small><strong>{order.otp_code}</strong></div>}
                        {order.expires_at && <div><small>EXPIRES</small><strong>{formatDate(order.expires_at)}</strong></div>}
                        {!order.otp_code && <p>Waiting for the verification code. Tap Refresh to check again.</p>}
                      </div>
                    ) : (
                      <div className="customer-order-fulfillment">
                        {getServiceEmail(order) && <div><small>SERVICE EMAIL</small><strong>{getServiceEmail(order)}</strong></div>}
                        <a href={getOtpLink(order)} target="_blank" rel="noreferrer" className="customer-order-otp-link">
                          <MessageCircle size={16} /> Request OTP via WhatsApp
                        </a>
                      </div>
                    )
                  ) : (
                    <p className="customer-order-locked-details">Service details and OTP support appear here after payment is confirmed and the order is fulfilled.</p>
                  )}
                  {canIssueReceipt(order) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                      <button type="button" className="customer-order-otp-link"
                        onClick={() => printReceipt(order)}>
                        Print / Save receipt as PDF
                      </button>
                      <a className="customer-order-otp-link"
                        href={`https://wa.me/?text=${encodeURIComponent(receiptText(order))}`}
                        target="_blank" rel="noopener noreferrer">
                        <MessageCircle size={16} /> Share receipt via WhatsApp
                      </a>
                    </div>
                  )}
                  {canDeleteOrder(order) && (
                    <button
                      type="button"
                      className="customer-order-delete"
                      onClick={() => handleDelete(order)}
                      disabled={deletingId === String(order.id || order.orderId)}
                    >
                      <Trash2 size={15} />
                      {deletingId === String(order.id || order.orderId) ? "Deleting…" : "Delete unpaid request"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <WhatsAppSupport />
      </main>
    </>
  );
}
