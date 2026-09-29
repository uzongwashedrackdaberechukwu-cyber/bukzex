import "./PopularServices.css";

const services = [
  {
    icon: "₦",
    title: "VTU",
    description: "Fast and convenient VTU services.",
    category: "VTU",
  },
  {
    icon: "◆",
    title: "Marketplace",
    description: "Explore products and digital offers.",
    category: "Marketplace",
  },
  {
    icon: "✉",
    title: "Virtual SMS / OTP",
    description: "Virtual messaging and verification services.",
    category: "Messaging",
  },
  {
    icon: "↗",
    title: "Social Media Boost",
    description: "Social media growth services.",
    category: "Social",
  },
  {
    icon: "▣",
    title: "Gift Cards",
    description: "Available gift card services.",
    category: "Gift Cards",
  },
  {
    icon: "₿",
    title: "Crypto",
    description: "Supported crypto services on BukzEx.",
    category: "Crypto",
  },
];

export default function PopularServices() {
  return (
    <section className="popular-services" id="popular-services">

      <div className="popular-services-container">

        <div className="popular-header">

          <div>
            <span className="popular-label">
              ← EXPLORE BUKZEX →
            </span>

            <h2>
              Our Core <span>Services</span>
            </h2>

            <p>
              Discover the main services available
              on the BukzEx platform.
            </p>
          </div>

          <div className="popular-navigation">
            <button aria-label="Previous services">
              ←
            </button>

            <button aria-label="Next services">
              →
            </button>
          </div>

        </div>

        <div className="popular-grid">

          {services.map((service) => (
            <article
              className="popular-card"
              key={service.title}
            >

              <div className="popular-card-top">

                <div
                  className={`popular-service-icon ${
                    service.category.toLowerCase().replace(/\s+/g, "-")
                  }`}
                >
                  {service.icon}
                </div>

                <span className="popular-category">
                  {service.category}
                </span>

              </div>

              <h3>{service.title}</h3>

              <p>{service.description}</p>

              <button className="popular-buy-button">
                View Service
                <span>→</span>
              </button>

            </article>
          ))}

        </div>

      </div>

    </section>
  );
}
