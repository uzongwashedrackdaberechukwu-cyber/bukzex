import { useEffect, useState } from "react";
import {
  Smartphone,
  Store,
  MessageSquare,
  Megaphone,
  Gift,
  Bitcoin,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { getServices } from "../../services/api";
import "./AdminServices.css";

const icons = {
  vtu: Smartphone,
  marketplace: Store,
  sms: MessageSquare,
  social: Megaphone,
  "gift-cards": Gift,
  crypto: Bitcoin,
};

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadServices() {
    try {
      setLoading(true);
      setError("");

      const result = await getServices();

      setServices(
        Array.isArray(result?.services)
          ? result.services
          : []
      );
    } catch (err) {
      setError(
        err.message || "Unable to load services."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  return (
    <section className="admin-services">
      <div className="admin-services-header">
        <div>
          <span className="admin-section-kicker">
            Service Management
          </span>

          <h2>Services</h2>

          <p>
            View the services currently available on
            BukzEx.
          </p>
        </div>

        <button
          type="button"
          className="admin-services-refresh"
          onClick={loadServices}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="admin-services-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-services-loading">
          Loading services...
        </div>
      ) : services.length === 0 ? (
        <div className="admin-services-empty">
          No services available.
        </div>
      ) : (
        <div className="admin-services-grid">
          {services.map((service) => {
            const Icon =
              icons[service.service_key] || Store;

            const available =
              String(service.status || "")
                .toLowerCase() === "active";

            return (
              <article
                className="admin-service-card"
                key={service.id}
              >
                <div className="admin-service-top">
                  <div className="admin-service-icon">
                    <Icon size={22} />
                  </div>

                  <span
                    className={`admin-service-status ${
                      available
                        ? "available"
                        : "unavailable"
                    }`}
                  >
                    {available ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}

                    {available
                      ? "Active"
                      : service.status === "setup_required"
                        ? "Setup required"
                        : "Paused"}
                  </span>
                </div>

                <h3>{service.name}</h3>

                <p>
                  {available
                    ? "Customers can submit requests for this service."
                    : service.status === "setup_required"
                      ? "Connect a provider and configure pricing before enabling this service."
                      : "This service is currently paused."}
                </p>

                <div className="admin-service-id">
                  Service ID:{" "}
                  <strong>{service.service_key}</strong>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
