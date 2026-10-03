import {
  ArrowLeft,
  ShoppingBag,
  LoaderCircle,
  RefreshCw,
  AlertCircle,
  MessageCircle,
  Trash2,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { deleteMyUnpaidOrder, getOrders, refreshDigitalServiceOrder } from "../services/api";
import WhatsAppSupport from "../components/WhatsAppSupport";
import ServiceBrandMark from "../components/ServiceBrandMark";

import "./CustomerOrders.css";

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

function canDeleteOrder(order) {
  const status = String(order?.status || "").toLowerCase();
  const paymentStatus = String(order?.payment_status || "").toLowerCase();
  return ["pending", "rejected", "failed"].includes(status)
    && (!paymentStatus || ["unpaid", "failed", "rejected"].includes(paymentStatus));
}

function getServiceEmail(order) {
  return order?.service_email || order?.serviceEmail ||
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

      const waiting = (Array.isArray(data) ? data : []).filter((order) =>
        order?.provider === "ShadexGoLtd" && order?.service_key === "marketplace" && order?.supplier_order_id && !order?.service_email
      );
      if (waiting.length) {
        await Promise.allSettled(waiting.map((order) => refreshDigitalServiceOrder(order.id)));
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

          <span className="customer-orders-eyebrow">PAYMENT · ORDER · STACK</span>

          <h1>My Payment &amp; Order Stack</h1>

          <p>
            Follow purchases from payment through order completion and access your delivered service details.
          </p>
        </div>

        <button
          type="button"
          className="customer-orders-refresh"
          onClick={() => loadOrders(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={15}
            className={
              refreshing
                ? "customer-orders-spin"
                : ""
            }
          />
          Refresh
        </button>
      </div>

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
      ) : (
        <div className="customer-orders-list">
          {orders.map((order, index) => {
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
                    <div className="customer-order-fulfillment">
                      {getServiceEmail(order) && (
                        <div>
                          <small>SERVICE EMAIL</small>
                          <strong>{getServiceEmail(order)}</strong>
                        </div>
                      )}
                      <a href={getOtpLink(order)} target="_blank" rel="noreferrer" className="customer-order-otp-link">
                        <MessageCircle size={16} /> Request OTP via WhatsApp
                      </a>
                    </div>
                  ) : (
                    <p className="customer-order-locked-details">Service details and OTP support appear here after payment is confirmed and the order is fulfilled.</p>
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
  );
}
