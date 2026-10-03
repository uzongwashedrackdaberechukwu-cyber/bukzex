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
    <>
    <header className="customer-services-topbar">
      <Link to="/customer" className="customer-services-brand"><span>B</span><strong>Bukz<span>Ex</span></strong></Link>
      <nav aria-label="Customer navigation"><Link to="/customer">Home</Link><Link to="/customer/services" className="active">Services</Link><Link to="/customer/orders">My purchases</Link><Link to="/customer/profile">Profile</Link></nav>
      <Link to="/customer" className="customer-services-account">My account <ArrowRight size={15} /></Link>
    </header>
    <main className="customer-services-page">
      <header className="customer-services-hero">
        <div className="customer-services-hero-copy">
          <span className="customer-services-eyebrow"><i /> ONE BUKZEX ACCOUNT · MANY POSSIBILITIES</span>
          <h1>Everyday services,<br /><em>made effortless.</em></h1>
          <p>Stay connected, take care of bills and find the digital services you need. Choose a category to see available options and clear prices.</p>
          <div className="customer-services-hero-actions"><Link to="/customer" className="customer-services-primary">Back to your dashboard <ArrowRight size={16} /></Link><span><span className="customer-services-secure">✓</span> Secure wallet checkout</span></div>
        </div>
        <div className="customer-services-showcase" aria-hidden="true">
          <div className="customer-services-showcase-orbit" />
          <div className="customer-showcase-main"><span>BUKZEX SERVICES</span><strong>All the essentials.<br />One simple place.</strong><small>Choose. Pay. Get on with your day.</small></div>
          <div className="customer-showcase-badges"><span><Smartphone size={15} /> VTU</span><span><Receipt size={15} /> BILLS</span><span><Store size={15} /> DIGITAL</span></div>
        </div>
      </header>

      <div className="customer-services-section-heading">
        <div>
          <span>YOUR SERVICE COLLECTION</span>
          <h2>What do you need today?</h2>
          <p>Select a category to browse its available services.</p>
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

      <aside className="customer-services-assurance"><span className="customer-services-assurance-mark"><span>✓</span></span><div><strong>One BukzEx account. Everyday services in one place.</strong><p>See available options and BukzEx prices before you continue to checkout.</p></div><Link to="/customer/orders">View my purchases <ArrowRight size={15} /></Link></aside>
      <WhatsAppSupport />
    </main>
    </>
  );
}
