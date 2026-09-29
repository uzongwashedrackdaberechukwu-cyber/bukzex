import {
  Smartphone,
  Store,
  MessageSquareCode,
  TrendingUp,
  Gift,
  Bitcoin,
  ArrowRight,
} from "lucide-react";

import { useState } from "react";
import { Link } from "react-router-dom";

import "./CustomerServices.css";

const services = [
  {
    id: "vtu",
    icon: Smartphone,
    title: "VTU",
    description: "Access available VTU services using your wallet balance.",
  },
  {
    id: "marketplace",
    icon: Store,
    title: "Marketplace",
    description: "Browse and purchase products available on BukzEx.",
  },
  {
    id: "sms",
    icon: MessageSquareCode,
    title: "Virtual SMS / OTP",
    description: "Access available virtual messaging services.",
  },
  {
    id: "social",
    icon: TrendingUp,
    title: "Social Media Boost",
    description: "Purchase available social media growth services.",
  },
  {
    id: "gift-cards",
    icon: Gift,
    title: "Gift Cards",
    description: "Purchase supported gift card services.",
  },
  {
    id: "crypto",
    icon: Bitcoin,
    title: "Crypto",
    description: "Access supported crypto services available on BukzEx.",
  },
];

export default function CustomerServices() {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <main className="customer-services-page">
      <div className="customer-services-header">
        <div>
          <span className="customer-services-eyebrow">
            BUKZEX SERVICES
          </span>

          <h1>Services</h1>

          <p>
            Select a service to continue with your purchase.
          </p>
        </div>

        <Link to="/customer" className="customer-services-wallet">
          Back to Dashboard
        </Link>
      </div>

      <section className="customer-services-grid">
        {services.map((service) => {
          const Icon = service.icon;

          return (
            <article
              key={service.id}
              className="customer-service-card"
            >
              <div className="customer-service-icon">
                <Icon size={22} />
              </div>

              <div className="customer-service-content">
                <h2>{service.title}</h2>

                <p>{service.description}</p>

                <button
                  type="button"
                  onClick={() => setSelectedService(service)}
                  className="customer-service-button"
                >
                  Continue
                  <ArrowRight size={15} />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {selectedService && (
        <div className="customer-service-overlay">
          <div className="customer-service-modal">
            <button
              type="button"
              className="customer-service-close"
              onClick={() => setSelectedService(null)}
            >
              ×
            </button>

            <div className="customer-service-modal-icon">
              {(() => {
                const SelectedIcon = selectedService.icon;
                return <SelectedIcon size={24} />;
              })()}
            </div>

            <h2>{selectedService.title}</h2>

            <p>
              Continue to the purchase page to enter the
              information required for this service.
            </p>

            <div className="customer-service-modal-actions">
              <Link
                to={`/customer/services/${selectedService.id}`}
                className="customer-service-fund"
              >
                Continue
              </Link>

              <button
                type="button"
                className="customer-service-cancel"
                onClick={() => setSelectedService(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
