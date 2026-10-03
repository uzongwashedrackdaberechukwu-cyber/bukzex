import {
  ArrowRight,
  MessageSquareCode,
  Receipt,
  Smartphone,
  Store,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import WhatsAppSupport from "../components/WhatsAppSupport";
import ServiceBrandMark from "../components/ServiceBrandMark";
import "./CustomerServices.css";

// These are the live ShadexGoLtd catalogues that BukzEx currently supports.
// Keep the tiles visible even if one catalogue is temporarily empty.
const services = [
  {
    id: "vtu",
    icon: Smartphone,
    title: "Airtime & Data",
    description: "Top up a phone or choose a mobile data plan.",
    accent: "blue",
    tag: "Mobile",
  },
  {
    id: "bills",
    icon: Receipt,
    title: "Bills",
    description: "Pay electricity and cable TV bills in one place.",
    accent: "gold",
    tag: "Utilities",
  },
  {
    id: "marketplace",
    icon: Store,
    title: "Marketplace",
    description: "Explore digital subscriptions such as Netflix and Spotify.",
    accent: "mint",
    tag: "Digital plans",
  },
  {
    id: "sms",
    icon: MessageSquareCode,
    title: "Virtual SMS / OTP",
    description: "Browse available virtual number and OTP services.",
    accent: "violet",
    tag: "Messaging",
  },
  {
    id: "social",
    icon: TrendingUp,
    title: "Social Media Boost",
    description: "Browse available growth packages for social platforms.",
    accent: "coral",
    tag: "Social",
  },
];

export default function CustomerServices() {
  return (
    <main className="customer-services-page">
      <header className="customer-services-hero">
        <div className="customer-services-hero-copy">
          <span className="customer-services-eyebrow">BUKZEX · SERVICES</span>
          <h1>What would you like to do?</h1>
          <p>Choose a service to view its available options and prices.</p>
        </div>
        <Link to="/customer" className="customer-services-wallet">
          Back to dashboard
        </Link>
      </header>

      <div className="customer-services-section-heading">
        <div>
          <span>BUKZEX SERVICES</span>
          <h2>Browse by category</h2>
        </div>
        <span className="customer-services-count">{services.length} services</span>
      </div>

      <section className="customer-services-grid" aria-label="Available services">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Link
              key={service.id}
              to={`/customer/services/${service.id}`}
              className={`customer-service-card customer-service-card-${service.accent}`}
            >
              <div className="customer-service-card-top">
                <span className="customer-service-icon">
                  <ServiceBrandMark
                    name={service.title}
                    fallbackIcon={Icon}
                    size="medium"
                  />
                </span>
                <span className="customer-service-tag">{service.tag}</span>
              </div>
              <div className="customer-service-content">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
              <span className="customer-service-action">
                Explore service <ArrowRight size={17} />
              </span>
            </Link>
          );
        })}
      </section>

      <aside className="customer-services-assurance">
        <span className="customer-services-assurance-mark"><span>B</span></span>
        <div>
          <strong>One BukzEx account. Everyday services in one place.</strong>
          <p>Check each service’s current options and BukzEx prices before checkout.</p>
        </div>
      </aside>
      <WhatsAppSupport />
    </main>
  );
}
