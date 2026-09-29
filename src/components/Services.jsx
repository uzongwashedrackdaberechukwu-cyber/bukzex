import { useRef } from "react";
import {
  Smartphone,
  Store,
  MessageSquareCode,
  TrendingUp,
  Gift,
  Bitcoin,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShieldCheck,
} from "lucide-react";

import "./Services.css";

const services = [
  {
    icon: Smartphone,
    title: "VTU",
    description:
      "Get convenient VTU services for your everyday digital needs.",
    action: "Get Started",
    theme: "vtu",
    badge: "Digital Services",
  },
  {
    icon: Store,
    title: "Marketplace",
    description:
      "Discover products and digital offers available on BukzEx.",
    action: "Shop Now",
    theme: "marketplace",
    badge: "Marketplace",
  },
  {
    icon: MessageSquareCode,
    title: "Virtual SMS / OTP",
    description:
      "Access virtual messaging and verification services.",
    action: "Get Started",
    theme: "sms",
    badge: "Messaging",
  },
  {
    icon: TrendingUp,
    title: "Social Media Boost",
    description:
      "Access social media growth services from one platform.",
    action: "Get Started",
    theme: "social",
    badge: "Social",
  },
  {
    icon: Gift,
    title: "Gift Cards",
    description:
      "Find and manage available gift card services.",
    action: "Get Gift Cards",
    theme: "gift",
    badge: "Gift Cards",
  },
  {
    icon: Bitcoin,
    title: "Crypto",
    description:
      "Explore supported crypto services available on BukzEx.",
    action: "Explore Crypto",
    theme: "crypto",
    badge: "Crypto",
  },
];

export default function Services() {
  const servicesRef = useRef(null);

  const scrollServices = (direction) => {
    if (!servicesRef.current) return;

    const amount = 330;

    servicesRef.current.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="services-section" id="services">

      <div className="services-container">

        {/* HEADER */}

        <div className="services-heading">

          <div className="section-label">
            OUR CORE SERVICES
          </div>

          <div className="services-heading-row">

            <div>
              <h2>
                Explore BukzEx
                <span> Services.</span>
              </h2>

              <p>
                Discover digital services, products and
                solutions available on the BukzEx platform.
              </p>
            </div>

            <div className="services-navigation">

              <button
                className="services-nav-btn"
                onClick={() => scrollServices("prev")}
                aria-label="Previous services"
              >
                <ChevronLeft size={19} strokeWidth={2} />
              </button>

              <button
                className="services-nav-btn"
                onClick={() => scrollServices("next")}
                aria-label="Next services"
              >
                <ChevronRight size={19} strokeWidth={2} />
              </button>

            </div>

          </div>

        </div>

        {/* SERVICES CAROUSEL */}

        <div
          className="services-grid"
          ref={servicesRef}
        >

          {services.map((service, index) => {
            const ServiceIcon = service.icon;

            return (
              <article
                className={`service-item service-${service.theme}`}
                key={service.title}
                style={{
                  "--service-delay": `${index * 80}ms`,
                }}
              >

                {/* VISUAL */}

                <div className="service-visual">

                  <div className="service-visual-glow"></div>

                  <div className="service-orbit service-orbit-one"></div>
                  <div className="service-orbit service-orbit-two"></div>

                  <div className="service-main-icon">
                    <ServiceIcon
                      size={46}
                      strokeWidth={1.7}
                    />
                  </div>

                  <div className="service-floating-dot service-dot-one"></div>
                  <div className="service-floating-dot service-dot-two"></div>

                </div>

                {/* CARD CONTENT */}

                <div className="service-card-content">

                  <div className="service-category">
                    <span>
                      <ServiceIcon
                        size={12}
                        strokeWidth={2}
                      />
                    </span>

                    {service.badge}
                  </div>

                  <h3>
                    {service.title}
                  </h3>

                  <p>
                    {service.description}
                  </p>

                  <button className="service-link">
                    <span className="service-link-text">
                      {service.action}
                    </span>

                    <span className="service-link-icon">
                      <ArrowRight
                        size={16}
                        strokeWidth={2.2}
                      />
                    </span>
                  </button>

                </div>

              </article>
            );
          })}

        </div>

        {/* SCROLL INDICATOR */}

        <div className="services-scroll-info">

          <div className="services-scroll-line">
            <span></span>
          </div>

          <p>
            Swipe or use the arrows to explore our services
          </p>

        </div>

        {/* TRUST STRIP */}

        <div className="services-trust-strip">

          <div className="services-trust-item">
            <span className="services-trust-icon">
              <Zap size={16} />
            </span>

            <div>
              <strong>Fast Service</strong>
              <small>Quick & convenient</small>
            </div>
          </div>

          <div className="services-trust-item">
            <span className="services-trust-icon">
              <ShieldCheck size={17} />
            </span>

            <div>
              <strong>Secure Platform</strong>
              <small>Built with security in mind</small>
            </div>
          </div>

          <div className="services-trust-item">
            <span className="services-trust-icon">
              <MessageSquareCode size={16} />
            </span>

            <div>
              <strong>24/7 Support</strong>
              <small>We're here when you need us</small>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
