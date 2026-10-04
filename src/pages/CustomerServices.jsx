import {
  ArrowRight,
  Search,
  MessageSquareCode,
  Mail,
  Receipt,
  Smartphone,
  Store,
  TrendingUp,
} from "lucide-react";
import { FaApple, FaFacebookF, FaGoogle, FaRobot, FaTelegramPlane, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { SiBinance, SiTinder, SiUber } from "react-icons/si";
import { useState } from "react";
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
    title: "Virtual Numbers",
    description: "Choose a virtual number and receive supported OTP codes.",
    accent: "violet",
    tag: "OTP & SMS",
  },
  {
    id: "social",
    icon: TrendingUp,
    title: "Social Media Boost",
    description: "Browse available growth packages for social platforms.",
    accent: "coral",
    tag: "Social",
  },
  {
    id: "email_verification",
    icon: Mail,
    title: "Email Verification",
    description: "Get a temporary email address and receive verification codes in BukzEx.",
    accent: "blue",
    tag: "New",
  },
];

const popularApps = [
  { name: "WhatsApp", icon: FaWhatsapp, color: "#25d366" },
  { name: "ChatGPT / OpenAI", icon: FaRobot, color: "#10a37f" },
  { name: "Telegram", icon: FaTelegramPlane, color: "#229ed9" },
  { name: "Google / Gmail", icon: FaGoogle, color: "#4285f4" },
  { name: "Apple ID", icon: FaApple, color: "#f4f7fb" },
  { name: "TikTok", icon: FaTiktok, color: "#f4f7fb" },
  { name: "Facebook", icon: FaFacebookF, color: "#0866ff" },
  { name: "Tinder", icon: SiTinder, color: "#ff4458" },
  { name: "Uber", icon: SiUber, color: "#f4f7fb" },
  { name: "Binance", icon: SiBinance, color: "#f0b90b" },
];

export default function CustomerServices() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", ...new Set(services.map((service) => service.tag))];
  const normalizedQuery = query.trim().toLowerCase();
  const visibleServices = services.filter((service) =>
    (activeFilter === "All" || service.tag === activeFilter) &&
    `${service.title} ${service.description} ${service.tag}`.toLowerCase().includes(normalizedQuery)
  );
  const visibleApps = popularApps.filter((app) =>
    app.name.toLowerCase().includes(normalizedQuery)
  );

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

      <div className="customer-service-controls">
        <label className="customer-service-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search services or apps"
            aria-label="Search services or apps"
          />
        </label>
        <div className="customer-service-filters" aria-label="Filter services">
          {filters.map((filter) => (
            <button
              type="button"
              key={filter}
              className={activeFilter === filter ? "active" : ""}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <section className="customer-services-grid" aria-label="Available services">
        {visibleServices.map((service) => {
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
        {visibleServices.length === 0 && (
          <p className="customer-services-empty">No matching services. Try another search or category.</p>
        )}
      </section>

      <aside className="customer-services-assurance"><span className="customer-services-assurance-mark"><span>✓</span></span><div><strong>One BukzEx account. Everyday services in one place.</strong><p>See available options and BukzEx prices before you continue to checkout.</p></div><Link to="/customer/orders">View my purchases <ArrowRight size={15} /></Link></aside>
      <WhatsAppSupport />
    </main>
    </>
  );
}
