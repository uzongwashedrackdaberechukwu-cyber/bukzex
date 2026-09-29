import {
  Smartphone,
  Store,
  MessageSquareCode,
  TrendingUp,
  Gift,
  Bitcoin,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./CTA.css";

const ctaServices = [
  { icon: Smartphone, position: "cta-service-one" },
  { icon: Store, position: "cta-service-two" },
  { icon: MessageSquareCode, position: "cta-service-three" },
  { icon: TrendingUp, position: "cta-service-four" },
  { icon: Gift, position: "cta-service-five" },
  { icon: Bitcoin, position: "cta-service-six" },
];

export default function CTA() {
  const navigate = useNavigate();

  const goToServices = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="cta-section">
      <div className="cta-background-grid"></div>

      <div className="cta-container">

        <div className="cta-content">
          <span className="cta-label">
            GET STARTED TODAY
          </span>

          <h2>
            Everything You Need.
            <span> One Account.</span>
          </h2>

          <p>
            Join BukzEx and access a growing collection of
            digital services from one convenient platform.
          </p>

          <div className="cta-actions">
            <button className="cta-primary" onClick={() => navigate("/signup")}>
              Create Free Account
              <span>
                <ArrowRight size={15} />
              </span>
            </button>

            <button className="cta-secondary" onClick={goToServices}>
              Explore Services
            </button>
          </div>
        </div>

        <div className="cta-decoration">

          <div className="cta-ring cta-ring-one"></div>
          <div className="cta-ring cta-ring-two"></div>
          <div className="cta-ring cta-ring-three"></div>

          <div className="cta-center-glow"></div>

          <div className="cta-service-orbit">
            {ctaServices.map((service) => {
              const ServiceIcon = service.icon;

              return (
                <div
                  className={`cta-service-icon ${service.position}`}
                  key={service.position}
                >
                  <ServiceIcon
                    size={18}
                    strokeWidth={1.8}
                  />
                </div>
              );
            })}
          </div>

          <div className="cta-center-mark">
            <span>B</span>
          </div>

        </div>

      </div>
    </section>
  );
}
