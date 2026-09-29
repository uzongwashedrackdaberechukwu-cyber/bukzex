import {
  WalletCards,
  Truck,
  ShieldCheck,
  Headset,
  ArrowRight,
  Users,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./WhyChooseUs.css";

const communityAvatars = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/75.jpg",
];

const benefits = [
  {
    icon: WalletCards,
    title: "Affordable Rates",
    description: "Competitive pricing across available digital services.",
    label: "BEST VALUE",
  },
  {
    icon: Truck,
    title: "Instant Delivery",
    description: "Fast processing for supported digital services.",
    label: "FAST SERVICE",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Safe",
    description: "Your account and transactions are handled securely.",
    label: "PROTECTED",
  },
  {
    icon: Headset,
    title: "24/7 Support",
    description: "Get assistance whenever you need help.",
    label: "ALWAYS HERE",
  },
];

export default function WhyChooseUs() {
  const navigate = useNavigate();

  return (
    <section className="why-choose" id="about">

      <div className="why-stars why-stars-one"></div>
      <div className="why-stars why-stars-two"></div>
      <div className="why-stars why-stars-three"></div>

      <div className="why-orb why-orb-one"></div>
      <div className="why-orb why-orb-two"></div>

      <div className="why-choose-container">

        {/* LEFT CONTENT */}

        <div className="why-choose-content">

          <div className="why-choose-label">
            <Sparkles size={12} />
            WHY CHOOSE BUKZEX
          </div>

          <div className="why-brand-mark">
            B
          </div>

          <h2>
            Your Trusted Partner
            <span> for Digital Services.</span>
          </h2>

          <p>
            BukzEx brings useful digital services together
            in one convenient platform, designed to make
            your experience simple, fast and reliable.
          </p>

          <button
            className="why-choose-button"
            onClick={() => navigate("/#services")}
          >
            Learn More
            <ArrowRight size={15} />
          </button>

          {/* TRUST */}

          <div className="why-trust">

            <div className="why-trust-avatars">

              <div className="why-avatar">
                <img
                  src="/images/people/person-1.jpg"
                  alt=""
                />
              </div>

              <div className="why-avatar">
                <img
                  src="/images/people/person-2.jpg"
                  alt=""
                />
              </div>

              <div className="why-avatar">
                <img
                  src="/images/people/person-3.jpg"
                  alt=""
                />
              </div>

              <div className="why-avatar why-avatar-logo">
                <span>B</span>
              </div>

            </div>

            <div className="why-trust-text">

              <strong>Growing User Community</strong>

              <span>
                Trusted by users exploring BukzEx
              </span>

            </div>

          </div>

        </div>

        {/* BENEFITS */}

        <div className="benefits-area">

          <div className="benefits-heading">

            <span>
              BUILT AROUND YOU
            </span>

            <small>
              Everything that makes BukzEx simple to use.
            </small>

          </div>

          <div className="benefits-grid">

            {benefits.map((benefit, index) => {
              const BenefitIcon = benefit.icon;

              return (
                <article
                  className="benefit-card"
                  key={benefit.title}
                  style={{
                    "--benefit-delay": `${index * 120}ms`,
                  }}
                >

                  <div className="benefit-card-glow"></div>

                  <div className="benefit-top">

                    <div className="benefit-icon">
                      <BenefitIcon
                        size={21}
                        strokeWidth={1.8}
                      />
                    </div>

                    <span className="benefit-label">
                      {benefit.label}
                    </span>

                  </div>

                  <div className="benefit-text">

                    <h3>
                      {benefit.title}
                    </h3>

                    <p>
                      {benefit.description}
                    </p>

                  </div>

                  <div className="benefit-bottom">

                    <CheckCircle2
                      size={13}
                    />

                    <span>
                      BukzEx advantage
                    </span>

                  </div>

                </article>
              );
            })}

          </div>

        </div>

      </div>

    </section>
  );
}
