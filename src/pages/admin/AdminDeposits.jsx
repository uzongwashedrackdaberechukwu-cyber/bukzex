import { useEffect, useMemo, useState } from "react";
import {
  Search,
  WalletCards,
  Clock3,
  CheckCircle2,
  RefreshCw,
  Eye,
  X,
  ShieldCheck,
} from "lucide-react";

import {
  getDeposits,
  confirmDemoDeposit,
} from "../../services/api";

import "./AdminDeposits.css";

function formatAmount(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "confirmed" || value === "success") {
    return "deposit-status-confirmed";
  }

  return "deposit-status-pending";
}

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedDeposit, setSelectedDeposit] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function loadDeposits() {
    try {
      setLoading(true);
      setError("");

      const result = await getDeposits();

      const data = Array.isArray(result)
        ? result
        : result?.deposits ||
          result?.data ||
          [];

      setDeposits(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load deposits."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeposits();
  }, []);

  const filteredDeposits = useMemo(() => {
    const query = search.trim().toLowerCase();

    return deposits.filter((deposit) => {
      const matchesFilter =
        filter === "all" ||
        String(deposit.status).toLowerCase() ===
          filter;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        deposit.reference,
        deposit.id,
        deposit.email,
        deposit.customerName,
        deposit.customer,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [deposits, search, filter]);

  const pendingCount = deposits.filter(
    (deposit) =>
      String(deposit.status).toLowerCase() ===
      "pending"
  ).length;

  const confirmedCount = deposits.filter(
    (deposit) =>
      String(deposit.status).toLowerCase() ===
      "confirmed"
  ).length;

  const totalAmount = deposits.reduce(
    (sum, deposit) =>
      sum + Number(deposit.amount || 0),
    0
  );

  async function handleDemoConfirm(deposit) {
    if (!deposit?.id) return;

    try {
      setProcessing(true);
      setError("");

      await confirmDemoDeposit(deposit.id);

      setSelectedDeposit(null);

      await loadDeposits();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to confirm deposit."
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <section className="admin-deposits">
      <div className="admin-deposits-header">
        <div>
          <span>WALLET MANAGEMENT</span>

          <h2>Deposits</h2>

          <p>
            Review customer wallet funding requests
            and transfer references.
          </p>
        </div>

        <button
          type="button"
          className="admin-deposits-refresh"
          onClick={loadDeposits}
          disabled={loading}
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? "admin-spin"
                : ""
            }
          />
          Refresh
        </button>
      </div>

      <div className="admin-deposit-stats">
        <div className="admin-deposit-stat">
          <div className="pending">
            <Clock3 size={18} />
          </div>

          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>

        <div className="admin-deposit-stat">
          <div className="confirmed">
            <CheckCircle2 size={18} />
          </div>

          <div>
            <span>Confirmed</span>
            <strong>{confirmedCount}</strong>
          </div>
        </div>

        <div className="admin-deposit-stat">
          <div className="wallet">
            <WalletCards size={18} />
          </div>

          <div>
            <span>Total Submitted</span>
            <strong>
              {formatAmount(totalAmount)}
            </strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-deposits-error">
          {error}
        </div>
      )}

      <div className="admin-deposits-toolbar">
        <div className="admin-deposits-search">
          <Search size={16} />

          <input
            type="search"
            placeholder="Search reference or customer..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="admin-deposit-filters">
          <button
            type="button"
            className={
              filter === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("all")
            }
          >
            All
          </button>

          <button
            type="button"
            className={
              filter === "pending"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("pending")
            }
          >
            Pending
          </button>

          <button
            type="button"
            className={
              filter === "confirmed"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("confirmed")
            }
          >
            Confirmed
          </button>
        </div>
      </div>

      <div className="admin-deposits-card">
        {loading ? (
          <div className="admin-deposits-empty">
            <RefreshCw className="admin-spin" size={24} />
            <p>Loading deposits...</p>
          </div>
        ) : filteredDeposits.length === 0 ? (
          <div className="admin-deposits-empty">
            <div className="empty-icon">
              <WalletCards size={24} />
            </div>

            <h3>No deposits found</h3>

            <p>
              Customer deposit submissions will
              appear here.
            </p>
          </div>
        ) : (
          <div className="admin-deposits-table-wrap">
            <table className="admin-deposits-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredDeposits.map(
                  (deposit) => (
                    <tr key={deposit.id}>
                      <td>
                        <strong className="deposit-reference">
                          {deposit.reference ||
                            "No reference"}
                        </strong>

                        <small>
                          {deposit.id}
                        </small>
                      </td>

                      <td>
                        {deposit.customerName ||
                          deposit.customer ||
                          deposit.email ||
                          "Customer"}
                      </td>

                      <td>
                        <strong>
                          {formatAmount(
                            deposit.amount
                          )}
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          deposit.createdAt
                        )}
                      </td>

                      <td>
                        <span
                          className={`deposit-status ${statusClass(
                            deposit.status
                          )}`}
                        >
                          {String(
                            deposit.status ||
                              "pending"
                          )}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-deposit-view"
                          onClick={() =>
                            setSelectedDeposit(
                              deposit
                            )
                          }
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDeposit && (
        <div
          className="admin-deposit-modal-overlay"
          onClick={() =>
            setSelectedDeposit(null)
          }
        >
          <section
            className="admin-deposit-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-deposit-modal-header">
              <div>
                <span>DEPOSIT DETAILS</span>

                <h3>
                  {formatAmount(
                    selectedDeposit.amount
                  )}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedDeposit(null)
                }
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <div className="admin-deposit-detail-list">
              <div>
                <span>Reference</span>
                <strong>
                  {selectedDeposit.reference ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>Deposit ID</span>
                <strong>
                  {selectedDeposit.id ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>Customer</span>
                <strong>
                  {selectedDeposit.customerName ||
                    selectedDeposit.customer ||
                    selectedDeposit.email ||
                    "Customer"}
                </strong>
              </div>

              <div>
                <span>Amount</span>
                <strong>
                  {formatAmount(
                    selectedDeposit.amount
                  )}
                </strong>
              </div>

              <div>
                <span>Submitted</span>
                <strong>
                  {formatDate(
                    selectedDeposit.createdAt
                  )}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong
                  className={
                    selectedDeposit.status ===
                    "confirmed"
                      ? "confirmed-text"
                      : "pending-text"
                  }
                >
                  {selectedDeposit.status ||
                    "pending"}
                </strong>
              </div>
            </div>

            {selectedDeposit.status ===
              "pending" && (
              <button
                type="button"
                className="admin-confirm-deposit"
                disabled={processing}
                onClick={() =>
                  handleDemoConfirm(
                    selectedDeposit
                  )
                }
              >
                <CheckCircle2 size={16} />

                {processing
                  ? "Confirming..."
                  : "Confirm Deposit (Demo)"}
              </button>
            )}

            <div className="admin-deposit-note">
              <ShieldCheck size={15} />

              <span>
                Demo confirmation is temporary.
                The live API will verify the actual
                transfer before crediting the wallet.
              </span>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
