import {
  MessageCircle,
  Star,
  Smartphone,
  Zap,
  Gift,
  ArrowRight,
  Users,
} from "lucide-react";

import "./Testimonials.css";

const testimonials = [
  {
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Chinedu K.",
    service: "VTU",
    tags: ["VTU", "Fast Service"],
    text:
      "BukzEx makes accessing digital services simple and convenient. The platform is easy to navigate.",
  },
  {
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Amaka S.",
    service: "Gift Cards",
    tags: ["Gift Cards", "Easy to Use"],
    text:
      "I like how everything is organized in one place. Finding the service I need is straightforward.",
  },
  {
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    name: "Tunde M.",
    service: "Marketplace",
    tags: ["Marketplace", "Reliable"],
    text:
      "The platform has a clean experience and makes it easy to explore the services available.",
  },
];

const tagIcons = {
  "VTU": Smartphone,
  "Fast Service": Zap,
  "Gift Cards": Gift,
  "Easy to Use": ArrowRight,
  "Marketplace": Users,
  "Reliable": Star,
};

export default function Testimonials() {
  return (
    <section className="testimonials" id="reviews">

      <div className="testimonial-stars testimonial-stars-one"></div>
      <div className="testimonial-stars testimonial-stars-two"></div>
      <div className="testimonial-stars testimonial-stars-three"></div>

      <div className="testimonials-container">

        {/* HEADER */}

        <div className="testimonials-header">

          <div className="testimonials-label">
            <MessageCircle size={13} />
            WHAT OUR CUSTOMERS SAY
          </div>

          <h2>
            Trusted by <span>Thousands.</span>
          </h2>

          <p>
            Discover why users choose BukzEx for convenient
            access to digital services.
          </p>

        </div>

        {/* SUMMARY */}

        <div className="testimonial-summary">

          <div className="testimonial-summary-icon">
            <Users size={20} />
          </div>

          <div className="testimonial-summary-text">

            <strong>
              Growing BukzEx Community
            </strong>

            <span>
              Users exploring digital services every day
            </span>

          </div>

          <div className="testimonial-summary-rating">

            <div>
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
            </div>

            <span>
              Customer Experience
            </span>

          </div>

        </div>

        {/* TESTIMONIALS */}

        <div className="testimonials-grid">

          {testimonials.map((testimonial, index) => (
            <article
              className="testimonial-card"
              key={testimonial.name}
              style={{
                "--testimonial-delay": `${index * 120}ms`,
              }}
            >

              <div className="testimonial-card-glow"></div>

              {/* TOP */}

              <div className="testimonial-top">

                <div className="testimonial-avatar">
                  <img src={testimonial.avatar} alt="" />
                  <div className="avatar-status"></div>
                </div>

                <div className="testimonial-user">

                  <h3>
                    {testimonial.name}
                  </h3>

                  <span className="testimonial-service">
                    {testimonial.service}
                  </span>

                </div>

                <div className="testimonial-stars">
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                </div>

              </div>

              {/* QUOTE */}

              <div className="testimonial-quote-icon">
                <MessageCircle size={25} />
              </div>

              <p className="testimonial-text">
                {testimonial.text}
              </p>

              {/* TAGS */}

              <div className="testimonial-tags">

                {testimonial.tags.map((tag) => {
                  const TagIcon = tagIcons[tag] || Star;

                  return (
                    <span
                      className="testimonial-tag"
                      key={tag}
                    >
                      <TagIcon size={10} />
                      {tag}
                    </span>
                  );
                })}

              </div>

              <div className="testimonial-card-line"></div>

            </article>
          ))}

        </div>

      </div>

    </section>
  );
}
