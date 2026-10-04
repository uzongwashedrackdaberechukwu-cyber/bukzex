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
} from "lucide-react";

import { getRegisteredUsers } from "../../services/auth";

import "./AdminCustomers.css";

function formatDate() {
  return "Registered customer";
}

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getRegisteredUsers()
      .then((users) => setAllCustomers(users.filter((user) => user.role !== "admin")))
      .catch((err) => setError(err.message || "Unable to load customers."));
  }, []);

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
            Search customer accounts and review their contact details.
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
                      <button
                        type="button"
                        className="admin-customer-view"
                        onClick={() =>
                          setSelectedCustomer(customer)
                        }
                      >
                        <Eye size={15} />
                        View
                      </button>
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
          onClick={() => setSelectedCustomer(null)}
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
                onClick={() =>
                  setSelectedCustomer(null)
                }
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

            <div className="admin-customer-secure">
              <ShieldCheck size={16} />
              Customer account information
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
