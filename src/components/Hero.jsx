import {
  Smartphone,
  Store,
  MessageSquareCode,
  TrendingUp,
  Gift,
  Bitcoin,
  ArrowRight,
  Zap,
  ShieldCheck,
  Headphones,
  Sparkles,
} from "lucide-react";

import "./Hero.css";

const orbitServices = [
  {
    name: "VTU",
    icon: Smartphone,
    position: "orbit-vtu",
  },
  {
    name: "Marketplace",
    icon: Store,
    position: "orbit-marketplace",
  },
  {
    name: "SMS / OTP",
    icon: MessageSquareCode,
    position: "orbit-sms",
  },
  {
    name: "Social Boost",
    icon: TrendingUp,
    position: "orbit-social",
  },
  {
    name: "Gift Cards",
    icon: Gift,
    position: "orbit-gift",
  },
  {
    name: "Crypto",
    icon: Bitcoin,
    position: "orbit-crypto",
  },
];

export default function Hero() {
  return (
    <section className="hero" id="home">

      <div className="hero-glow hero-glow-one"></div>
      <div className="hero-glow hero-glow-two"></div>

      <div className="hero-container">

        {/* HERO CONTENT */}

        <div className="hero-content">

          <div className="hero-badge">
            FAST
            <span>•</span>
            SECURE
            <span>•</span>
            AFFORDABLE
          </div>

          <h1>
            Everything Digital,
            <span> One Place.</span>
          </h1>

          <p>
            Access VTU, marketplace, virtual SMS/OTP,
            social media boost, gift cards and crypto
            services from one convenient platform.
          </p>

          <div className="hero-buttons">

            <button className="hero-primary-btn">
              Create an Account
              <span>
                <ArrowRight size={18} />
              </span>
            </button>

            <button className="hero-secondary-btn">
              View Services
            </button>

          </div>

          <div className="hero-features">

            <div className="hero-feature">
              <div className="feature-icon">
                <Zap size={14} />
              </div>
              <span>Fast Service</span>
            </div>

            <div className="hero-feature">
              <div className="feature-icon">
                <ShieldCheck size={14} />
              </div>
              <span>Secure Platform</span>
            </div>

            <div className="hero-feature">
              <div className="feature-icon">
                <Headphones size={14} />
              </div>
              <span>24/7 Support</span>
            </div>

            <div className="hero-feature">
              <div className="feature-icon">
                <Sparkles size={14} />
              </div>
              <span>Easy to Use</span>
            </div>

          </div>

        </div>

        {/* HERO ORBITAL VISUAL */}

        <div className="hero-visual">

          <div className="hero-orbit-scene">

            {/* OUTER GLOW */}

            <div className="hero-scene-glow"></div>

            {/* ORBIT RINGS */}

            <div className="hero-orbit-ring hero-orbit-ring-outer">
              <div className="orbit-ring-light"></div>
            </div>

            <div className="hero-orbit-ring hero-orbit-ring-inner">
              <div className="orbit-ring-light"></div>
            </div>

            {/* CENTER PHONE */}

            <div className="hero-phone-glow"></div>

            <div className="hero-phone">

              <div className="hero-phone-frame">

                <div className="hero-phone-camera"></div>

                <div className="hero-phone-screen">

                  <div className="phone-status">
                    <span>9:41</span>
                    <span>● ● ●</span>
                  </div>

                  <div className="phone-brand">
                    <div className="phone-brand-mark">
                      B
                    </div>

                    <span>
                      Bukz<span>Ex</span>
                    </span>
                  </div>

                  <div className="phone-balance-label">
                    DIGITAL PLATFORM
                  </div>

                  <div className="phone-balance">
                    BukzEx
                  </div>

                  <div className="phone-screen-line"></div>

                  <div className="phone-mini-grid">

                    <div>
                      <Smartphone size={14} />
                      <span>VTU</span>
                    </div>

                    <div>
                      <Store size={14} />
                      <span>Market</span>
                    </div>

                    <div>
                      <Gift size={14} />
                      <span>Cards</span>
                    </div>

                    <div>
                      <Bitcoin size={14} />
                      <span>Crypto</span>
                    </div>

                  </div>

                </div>

                <div className="hero-phone-button"></div>

              </div>

            </div>

            {/* CENTER GLOW */}

            <div className="hero-center-pulse"></div>

            {/* ORBITING SERVICES */}

            <div className="hero-service-orbit">

              {orbitServices.map((service) => {
                const ServiceIcon = service.icon;

                return (
                  <div
                    className={`hero-orbit-item ${service.position}`}
                    key={service.name}
                  >
                    <div className="hero-orbit-item-content">

                      <div className="hero-orbit-icon">
                        <ServiceIcon
                          size={20}
                          strokeWidth={1.8}
                        />
                      </div>

                      <span>
                        {service.name}
                      </span>

                    </div>
                  </div>
                );
              })}

            </div>

            {/* PARTICLES */}

            <span className="hero-particle particle-one"></span>
            <span className="hero-particle particle-two"></span>
            <span className="hero-particle particle-three"></span>
            <span className="hero-particle particle-four"></span>
            <span className="hero-particle particle-five"></span>
            <span className="hero-particle particle-six"></span>

          </div>

        </div>

      </div>

    </section>
  );
}
