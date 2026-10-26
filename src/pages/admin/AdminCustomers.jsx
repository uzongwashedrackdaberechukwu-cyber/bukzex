import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  UserRound,
  Mail,
  Phone,
  Eye,
  X,
  ShieldCheck,
  WalletCards,
  LoaderCircle,
} from "lucide-react";

import { getRegisteredUsers } from "../../services/auth";
import { creditCustomerWallet, debitCustomerWallet } from "../../services/api";


function formatDate() {
  return "Registered customer";
}

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [error, setError] = useState("");
  const [walletAction, setWalletAction] = useState("credit");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditKey, setCreditKey] = useState("");
  const [crediting, setCrediting] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [creditNotice, setCreditNotice] = useState("");

  useEffect(() => {
    getRegisteredUsers()
      .then((users) => setAllCustomers(users.filter((user) => user.role !== "admin")))
      .catch((err) => setError(err.message || "Unable to load customers."));
  }, []);

  function openCustomer(customer) {
    setCreditAmount("");
    setCreditReason("");
    setCreditKey("");
    setCreditError("");
    setCreditNotice("");
    setWalletAction("credit");
    setSelectedCustomer(customer);
  }

  function closeCustomer() {
    if (creditKey && !creditNotice) {
      setCreditError("This wallet adjustment may have reached the server. Retry the same request first; its reference prevents a duplicate adjustment.");
      return;
    }
    setSelectedCustomer(null);
    setCreditAmount("");
    setCreditReason("");
    setCreditKey("");
    setCreditError("");
    setCreditNotice("");
  }

  async function handleWalletCredit(event) {
    event.preventDefault();
    if (!selectedCustomer?.id) {
      setCreditError("Customer account ID is missing.");
      return;
    }
    if (creditKey) {
      // Keep the same idempotency key and frozen form values after an
      // uncertain network response so retrying cannot double-credit.
    } else {
      const amount = Number(creditAmount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) {
        setCreditError("Enter an amount between ₦0.01 and ₦10,000,000.");
        return;
      }
      if (Math.round(amount * 100) < 1 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001) {
        setCreditError("Enter an amount with no more than two decimal places.");
        return;
      }
      if (creditReason.trim().length < 5) {
        setCreditError("Enter a reason of at least five characters for the audit record.");
        return;
      }
    }

    const amountMinor = Math.round(Number(creditAmount) * 100);
    const reason = creditReason.trim();
    const key = creditKey || globalThis.crypto.randomUUID();
    setCreditKey(key);
    setCrediting(true);
    setCreditError("");
    setCreditNotice("");
    try {
      const result = await (walletAction === "debit" ? debitCustomerWallet : creditCustomerWallet)(selectedCustomer.id, amountMinor, reason, key);
      setCreditNotice(`${walletAction === "debit" ? "Removed" : "Credited"} ₦${(Number(result.amount_minor || amountMinor) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. New wallet balance: ₦${Number(result.balance || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. ${result.duplicate ? "This was an idempotent retry; no duplicate adjustment was applied." : "The adjustment is recorded in the transaction ledger and admin audit log."}`);
      setCreditAmount("");
      setCreditReason("");
      setCreditKey("");
    } catch (err) {
      if ([400, 403, 404, 422].includes(Number(err?.status))) setCreditKey("");
      setCreditError(err?.message || "Wallet adjustment could not be confirmed. Retry the same request before starting another adjustment.");
    } finally {
      setCrediting(false);
    }
  }

  const customers = useMemo(() => {
    return allCustomers.filter((user) => {
      const value = search.toLowerCase().trim();

      if (!value) return true;

      return [
        user.firstName,
        user.lastName,
        user.email,
        user.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value);
    });
  }, [allCustomers, search]);

  return (
    <section className="admin-customers">
      <div className="admin-customers-header">
        <div>
          <span>CUSTOMER MANAGEMENT</span>
          <h2>Customers</h2>
          <p>
            Search customer accounts, credit wallets and review account details.
          </p>
        </div>

        <div className="admin-customers-count">
          <Users size={18} />
          <strong>{customers.length}</strong>
          <small>Customers</small>
        </div>
      </div>

      <div className="admin-customers-toolbar">
        <div className="admin-customers-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>
      </div>

      <div className="admin-customers-table-card">
        {error && <p role="alert">{error}</p>}
        {customers.length === 0 ? (
          <div className="admin-customers-empty">
            <div>
              <Users size={25} />
            </div>

            <h3>
              {search
                ? "No customers found"
                : "No customers yet"}
            </h3>

            <p>
              {search
                ? "Try a different search term."
                : "Customers created through the signup page will appear here."}
            </p>
          </div>
        ) : (
          <div className="admin-customers-table-wrap">
            <table className="admin-customers-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="admin-customer-person">
                        <div className="admin-customer-avatar">
                          {customer.firstName
                            ?.charAt(0)
                            .toUpperCase() || "C"}
                        </div>

                        <div>
                          <strong>
                            {customer.firstName}{" "}
                            {customer.lastName}
                          </strong>

                          <small>
                            {formatDate()}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="admin-customer-contact">
                        <Mail size={13} />
                        {customer.email}
                      </span>
                    </td>

                    <td>
                      <span className="admin-customer-contact">
                        <Phone size={13} />
                        {customer.phone || "Not provided"}
                      </span>
                    </td>

                    <td>
                      <span className="admin-customer-role">
                        <UserRound size={12} />
                        Customer
                      </span>
                    </td>

                    <td>
                      <span className="admin-customer-status">
                        Registered
                      </span>
                    </td>

                    <td>
                      <div className="admin-customer-actions">
                        <button
                          type="button"
                          className="admin-customer-credit"
                          onClick={() => openCustomer(customer)}
                        >
                          <WalletCards size={15} />
                          Credit wallet
                        </button>
                        <button
                          type="button"
                          className="admin-customer-view"
                          onClick={() => openCustomer(customer)}
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div
          className="admin-customer-modal-overlay"
          onClick={closeCustomer}
        >
          <section
            className="admin-customer-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-customer-modal-header">
              <div>
                <span>CUSTOMER DETAILS</span>
                <h3>
                  {selectedCustomer.firstName}{" "}
                  {selectedCustomer.lastName}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeCustomer}
                disabled={crediting}
                aria-label="Close customer details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="admin-customer-profile">
              <div className="admin-customer-large-avatar">
                {selectedCustomer.firstName
                  ?.charAt(0)
                  .toUpperCase() || "C"}
              </div>

              <div>
                <strong>
                  {selectedCustomer.firstName}{" "}
                  {selectedCustomer.lastName}
                </strong>

                <small>Customer account</small>
              </div>
            </div>

            <div className="admin-customer-details">
              <div>
                <span>Email</span>
                <strong>
                  {selectedCustomer.email}
                </strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>
                  {selectedCustomer.phone ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <span>Role</span>
                <strong>Customer</strong>
              </div>

              <div>
                <span>Account status</span>
                <strong className="active">
                  Active
                </strong>
              </div>
            </div>

            <form className="admin-wallet-credit-form" onSubmit={handleWalletCredit}>
              <div className="admin-wallet-credit-heading">
                <span className="admin-wallet-credit-icon"><WalletCards size={18} /></span>
                <div><strong>Adjust customer wallet</strong><small>NGN wallet · audited administrator action</small></div>
              </div>
              <label htmlFor="admin-wallet-action">Wallet action</label>
              <select id="admin-wallet-action" value={walletAction} disabled={Boolean(creditKey) || crediting} onChange={(event) => { setWalletAction(event.target.value); setCreditError(""); setCreditNotice(""); }}>
                <option value="credit">Add money</option>
                <option value="debit">Remove money</option>
              </select>
              {walletAction === "debit" && <p>Remove funds from this customer’s available wallet balance. A reason is required and the action is recorded.</p>}
              <label htmlFor="admin-credit-amount">Amount (₦)</label>
              <input
                id="admin-credit-amount"
                type="number"
                min="0.01"
                max="10000000"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={creditAmount}
                disabled={Boolean(creditKey) || crediting}
                onChange={(event) => setCreditAmount(event.target.value)}
                required
              />
              <label htmlFor="admin-credit-reason">Reason / reference</label>
              <textarea
                id="admin-credit-reason"
                rows="2"
                maxLength="240"
                placeholder="e.g. Verified bank transfer reference"
                value={creditReason}
                disabled={Boolean(creditKey) || crediting}
                onChange={(event) => setCreditReason(event.target.value)}
                required
              />
              {creditKey && !creditNotice && <small className="admin-wallet-credit-retry-note">This attempt is locked to the same reference. Retry it to safely resolve an uncertain response.</small>}
              {creditError && <p className="admin-wallet-credit-message error" role="alert">{creditError}</p>}
              {creditNotice && <p className="admin-wallet-credit-message success" role="status">{creditNotice}</p>}
              <button type="submit" className="admin-wallet-credit-submit" disabled={crediting || !creditAmount || !creditReason.trim()}>
                {crediting ? <><LoaderCircle size={15} className="admin-wallet-credit-spinner" /> Applying adjustment…</> : creditKey ? "Retry same adjustment safely" : walletAction === "debit" ? "Remove money" : "Add money"}
              </button>
            </form>

            <div className="admin-customer-secure">
              <ShieldCheck size={16} />
              Wallet changes are server-validated, idempotent and audit-logged.
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
