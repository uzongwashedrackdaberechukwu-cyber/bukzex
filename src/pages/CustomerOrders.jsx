import {
  ArrowLeft,
  ShoppingBag,
  LoaderCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getOrders } from "../services/api";

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
    value === "completed"
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

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async (manual = false) => {
    try {
      setError("");

      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await getOrders();

      const data = Array.isArray(result)
        ? result
        : result?.orders || result?.data || [];

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

          <span className="customer-orders-eyebrow">
            BUKZEX ACCOUNT
          </span>

          <h1>My Orders</h1>

          <p>
            View your service purchases and their current status.
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

          <h2>No orders yet</h2>

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
                  <ShoppingBag size={20} />
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
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
