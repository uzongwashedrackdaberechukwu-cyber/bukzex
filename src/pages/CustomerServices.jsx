import {
  Smartphone,
  Store,
  MessageSquareCode,
  TrendingUp,
  Gift,
  Bitcoin,
  Receipt,
  ArrowRight,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getServices } from "../services/api";

import "./CustomerServices.css";

const services = [
  {
    id: "vtu",
    icon: Smartphone,
    title: "Airtime & Data",
    description: "Browse live airtime networks and data plans.",
  },
  {
    id: "bills",
    icon: Receipt,
    title: "Bills",
    description: "Browse electricity and cable TV providers.",
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
    description: "Browse live social media growth packages.",
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
  const [enabledServices, setEnabledServices] = useState(null);
  const [serviceError, setServiceError] = useState("");

  useEffect(() => {
    getServices()
      .then((result) => {
        const active = new Set(
          (result.services || [])
            .filter((service) => service.status === "active")
            .map((service) => service.service_key),
        );
        setEnabledServices(active);
      })
      .catch((err) => {
        setServiceError(err.message || "Service information is not available yet.");
        setEnabledServices(new Set());
      });
  }, []);

  const activeServices = services.filter(
    (service) => enabledServices?.has(service.id) || service.id === "bills",
  );

  return (
    <main className="customer-services-page">
      <div className="customer-services-header">
        <div>
          <span className="customer-services-eyebrow">BUKZEX SERVICES</span>
          <h1>Services</h1>
          <p>Select a service to continue with your purchase.</p>
        </div>
        <Link to="/customer" className="customer-services-wallet">Back to Dashboard</Link>
      </div>

      {serviceError && <p role="status">{serviceError}</p>}

      {enabledServices && activeServices.length === 0 ? (
        <section className="customer-services-grid">
          <article className="customer-service-card">
            <div className="customer-service-content">
              <h2>Services are being connected</h2>
              <p>Available services will appear here after their provider and prices are set up.</p>
            </div>
          </article>
        </section>
      ) : (
        <section className="customer-services-grid">
          {activeServices.map((service) => {
            const Icon = service.icon;
            return (
              <article key={service.id} className="customer-service-card">
                <div className="customer-service-icon"><Icon size={22} /></div>
                <div className="customer-service-content">
                  <h2>{service.title}</h2>
                  <p>{service.description}</p>
                  <button type="button" onClick={() => setSelectedService(service)} className="customer-service-button">
                    Continue <ArrowRight size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selectedService && (
        <div className="customer-service-overlay">
          <div className="customer-service-modal">
            <button type="button" className="customer-service-close" onClick={() => setSelectedService(null)}>×</button>
            <div className="customer-service-modal-icon">
              {(() => { const SelectedIcon = selectedService.icon; return <SelectedIcon size={24} />; })()}
            </div>
            <h2>{selectedService.title}</h2>
            <p>Continue to browse the available options for this service.</p>
            <div className="customer-service-modal-actions">
              <Link to={`/customer/services/${selectedService.id}`} className="customer-service-fund">Continue</Link>
              <button type="button" className="customer-service-cancel" onClick={() => setSelectedService(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
