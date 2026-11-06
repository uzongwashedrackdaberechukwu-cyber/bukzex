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
  getWalletTransactions,
} from "../../services/api";
import AdminPagination from "../../components/admin/AdminPagination";


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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTransactions() {
    try {
      setLoading(true);
      setError("");

      const result = await getWalletTransactions();
      const rows = result.transactions || [];
      setTransactions(rows.map((row) => {
        const rawType = String(row.transaction_type || "").toLowerCase();
        const type = rawType === "deposit" ? "deposit"
          : rawType === "admin_credit" ? "credit"
            : rawType === "refund" ? "refund"
              : ["withdrawal", "admin_debit"].includes(rawType) ? "withdrawal"
                : "purchase";
        const labels = {
          deposit: "Wallet Deposit",
          credit: "Administrator Wallet Credit",
          refund: "Wallet Refund",
          withdrawal: "Wallet Withdrawal",
          purchase: "Service Purchase",
        };
        return {
          id: row.id,
          type,
          label: rawType === "admin_debit" ? "Administrator Wallet Debit" : labels[type],
          reference: row.source_id,
          amount: Number(row.amount || 0),
          status: row.status,
          createdAt: row.created_at,
          customer: row.user_id,
          details: row.description,
          adminUid: row.admin_uid || "",
          adminAction: rawType.startsWith("admin_"),
        };
      }));
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
    void Promise.resolve().then(loadTransactions);
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
        transaction.adminUid,
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

  const visibleTransactions = useMemo(
    () => filteredTransactions.slice((page - 1) * pageSize, page * pageSize),
    [filteredTransactions, page, pageSize],
  );

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
      .filter((item) => item.type === "purchase")
      .reduce((sum, item) => sum + item.amount, 0);
    const credits = transactions
      .filter((item) => item.type === "credit")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      deposits,
      purchases,
      credits,
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
        <div className="admin-transaction-stat credit">
          <span>Admin Wallet Credits</span>
          <strong>{formatMoney(totals.credits)}</strong>
        </div>
      </div>

      <div className="admin-transactions-toolbar">
        <div className="admin-transactions-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
          />
        </div>

        <div className="admin-transactions-filters">
          {[
            ["all", "All"],
            ["deposit", "Deposits"],
            ["purchase", "Purchases"],
            ["credit", "Wallet credits"],
            ["refund", "Refunds"],
            ["withdrawal", "Withdrawals"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={
                filter === value ? "active" : ""
              }
              onClick={() => {
                setPage(1);
                setFilter(value);
              }}
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
                <th>Actor</th>
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
                    colSpan="8"
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
                visibleTransactions.map(
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

                          {transaction.label}
                        </span>
                      </td>

                      <td>
                        {transaction.customer}
                      </td>

                      <td>
                        <span className={transaction.adminUid ? "admin-transaction-actor admin" : "admin-transaction-actor"}>
                          {transaction.adminUid ? "Administrator" : "System / customer"}
                        </span>
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

      <AdminPagination
        page={page}
        pageSize={pageSize}
        total={filteredTransactions.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

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
                <strong>{selected.label}</strong>
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
                <span>Performed by</span>
                <strong>{selected.adminUid ? "Administrator" : "System / customer"}</strong>
              </div>
              {selected.adminUid ? (
                <div className="full">
                  <span>Administrator UID</span>
                  <strong>{selected.adminUid}</strong>
                </div>
              ) : null}

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
