import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  RefreshCw,
  ReceiptText,
  X,
} from "lucide-react";

import {
  getDeposits,
  getOrders,
} from "../../services/api";

import "./AdminTransactions.css";

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

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTransactions() {
    try {
      setLoading(true);
      setError("");

      const [depositResult, orderResult] =
        await Promise.all([
          getDeposits(),
          getOrders(),
        ]);

      const deposits = Array.isArray(
        depositResult?.deposits
      )
        ? depositResult.deposits
        : [];

      const orders = Array.isArray(
        orderResult?.orders
      )
        ? orderResult.orders
        : [];

      const depositTransactions = deposits.map(
        (deposit) => ({
          id: deposit.id,
          type: "deposit",
          label: "Wallet Deposit",
          reference: deposit.reference,
          amount: Number(deposit.amount || 0),
          status: deposit.status || "pending",
          createdAt: deposit.createdAt,
          customer:
            deposit.customerName ||
            deposit.customer ||
            deposit.email ||
            "Customer",
          details: deposit.reference
            ? `Transfer reference: ${deposit.reference}`
            : "Wallet deposit",
        })
      );

      const orderTransactions = orders.map(
        (order) => ({
          id: order.id,
          type: "purchase",
          label:
            order.serviceName ||
            order.service ||
            "Service Purchase",
          reference: order.id,
          amount: Number(order.amount || 0),
          status: order.status || "pending",
          createdAt: order.createdAt,
          customer:
            order.customerName ||
            order.customer ||
            order.email ||
            "Customer",
          details: order.details || "Service purchase",
        })
      );

      const combined = [
        ...depositTransactions,
        ...orderTransactions,
      ].sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );

      setTransactions(combined);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load transactions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesFilter =
        filter === "all" ||
        transaction.type === filter;

      if (!matchesFilter) return false;

      if (!query) return true;

      return [
        transaction.id,
        transaction.label,
        transaction.reference,
        transaction.customer,
        transaction.status,
        transaction.details,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
  }, [transactions, search, filter]);

  const totals = useMemo(() => {
    const deposits = transactions
      .filter(
        (item) => item.type === "deposit"
      )
      .reduce(
        (sum, item) => sum + item.amount,
        0
      );

    const purchases = transactions
      .filter(
        (item) => item.type === "purchase"
      )
      .reduce(
        (sum, item) => sum + item.amount,
        0
      );

    return {
      deposits,
      purchases,
      count: transactions.length,
    };
  }, [transactions]);

  return (
    <section className="admin-transactions">
      <div className="admin-transactions-header">
        <div>
          <span className="admin-section-kicker">
            Financial Activity
          </span>

          <h2>Transactions</h2>

          <p>
            Review wallet deposits and customer
            service purchases.
          </p>
        </div>

        <button
          type="button"
          className="admin-transactions-refresh"
          onClick={loadTransactions}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="admin-transactions-stats">
        <div className="admin-transaction-stat">
          <span>Total Transactions</span>
          <strong>{totals.count}</strong>
        </div>

        <div className="admin-transaction-stat deposit">
          <span>Total Deposits</span>
          <strong>
            {formatMoney(totals.deposits)}
          </strong>
        </div>

        <div className="admin-transaction-stat purchase">
          <span>Service Purchases</span>
          <strong>
            {formatMoney(totals.purchases)}
          </strong>
        </div>
      </div>

      <div className="admin-transactions-toolbar">
        <div className="admin-transactions-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="admin-transactions-filters">
          {[
            ["all", "All"],
            ["deposit", "Deposits"],
            ["purchase", "Purchases"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={
                filter === value ? "active" : ""
              }
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="admin-transactions-error">
          {error}
        </div>
      )}

      <div className="admin-transactions-card">
        <div className="admin-transactions-table-wrap">
          <table className="admin-transactions-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Type</th>
                <th>Customer</th>
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
                    colSpan="7"
                    className="admin-transactions-empty"
                  >
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="admin-transactions-empty"
                  >
                    <ReceiptText size={34} />
                    <strong>
                      No transactions found
                    </strong>
                    <span>
                      Transactions will appear here
                      as customers use BukzEx.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(
                  (transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <div className="admin-transaction-id">
                          {transaction.id}
                        </div>
                        <small>
                          {transaction.label}
                        </small>
                      </td>

                      <td>
                        <span
                          className={`admin-transaction-type ${transaction.type}`}
                        >
                          {transaction.type ===
                          "deposit" ? (
                            <ArrowDownToLine
                              size={14}
                            />
                          ) : (
                            <ArrowUpFromLine
                              size={14}
                            />
                          )}

                          {transaction.type ===
                          "deposit"
                            ? "Deposit"
                            : "Purchase"}
                        </span>
                      </td>

                      <td>
                        {transaction.customer}
                      </td>

                      <td>
                        <strong>
                          {formatMoney(
                            transaction.amount
                          )}
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          transaction.createdAt
                        )}
                      </td>

                      <td>
                        <span
                          className={`admin-transaction-status ${String(
                            transaction.status
                          ).toLowerCase()}`}
                        >
                          {transaction.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-transaction-view"
                          onClick={() =>
                            setSelected(
                              transaction
                            )
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div
          className="admin-transaction-modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <div
            className="admin-transaction-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-transaction-modal-header">
              <div>
                <span>Transaction Details</span>
                <h3>{selected.id}</h3>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-transaction-details">
              <div>
                <span>Type</span>
                <strong>
                  {selected.type === "deposit"
                    ? "Wallet Deposit"
                    : "Service Purchase"}
                </strong>
              </div>

              <div>
                <span>Amount</span>
                <strong>
                  {formatMoney(selected.amount)}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selected.status}</strong>
              </div>

              <div>
                <span>Customer</span>
                <strong>
                  {selected.customer}
                </strong>
              </div>

              <div>
                <span>Date</span>
                <strong>
                  {formatDate(
                    selected.createdAt
                  )}
                </strong>
              </div>

              <div>
                <span>Reference</span>
                <strong>
                  {selected.reference || "—"}
                </strong>
              </div>

              <div className="full">
                <span>Details</span>
                <strong>
                  {selected.details || "—"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
