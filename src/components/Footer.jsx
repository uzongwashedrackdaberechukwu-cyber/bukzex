import {
  ArrowRight,
  Smartphone,
  Store,
  MessageSquareCode,
  TrendingUp,
  Gift,
  Bitcoin,
  Mail,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6";

import "./Footer.css";

const serviceLinks = [
  { name: "VTU", icon: Smartphone },
  { name: "Marketplace", icon: Store },
  { name: "Virtual SMS / OTP", icon: MessageSquareCode },
  { name: "Social Media Boost", icon: TrendingUp },
  { name: "Gift Cards", icon: Gift },
  { name: "Crypto", icon: Bitcoin },
];

const companyLinks = [
  "About Us",
  "How It Works",
  "Contact Us",
  "FAQ",
];

const supportLinks = [
  "Help Center",
  "Terms of Service",
  "Privacy Policy",
];

export default function Footer() {
  return (
    <footer className="footer">

      <div className="footer-glow"></div>

      <div className="footer-container">

        <div className="footer-main">

          {/* BRAND */}

          <div className="footer-brand-column">

            <a href="#home" className="footer-brand">
              <span className="footer-brand-mark">B</span>

              <span className="footer-brand-name">
                Bukz<span>Ex</span>
              </span>
            </a>

            <p className="footer-description">
              One convenient platform for accessing digital
              services, products and solutions.
            </p>

            <div className="footer-socials">

              <a href="#" aria-label="Facebook">
                <FaFacebookF />
              </a>

              <a href="#" aria-label="Instagram">
                <FaInstagram />
              </a>

              <a href="#" aria-label="X">
                <FaXTwitter />
              </a>

              <a href="#" aria-label="WhatsApp">
                <FaWhatsapp />
              </a>

            </div>

          </div>

          {/* SERVICES */}

          <div className="footer-column footer-services-column">

            <h3>Services</h3>

            {serviceLinks.map((link) => {
              const ServiceIcon = link.icon;

              return (
                <a
                  href="#services"
                  key={link.name}
                  className="footer-service-link"
                >
                  <ServiceIcon
                    size={12}
                    strokeWidth={1.8}
                  />

                  <span>{link.name}</span>
                </a>
              );
            })}

          </div>

          {/* COMPANY */}

          <div className="footer-column">

            <h3>Company</h3>

            {companyLinks.map((link) => (
              <a href="#" key={link}>
                {link}
              </a>
            ))}

          </div>

          {/* SUPPORT */}

          <div className="footer-column">

            <h3>Support</h3>

            {supportLinks.map((link) => (
              <a href="#" key={link}>
                {link}
              </a>
            ))}

          </div>

          {/* NEWSLETTER */}

          <div className="footer-newsletter">

            <div className="footer-newsletter-label">
              STAY CONNECTED
            </div>

            <h3>
              Get BukzEx updates.
            </h3>

            <p>
              Receive important platform updates,
              announcements and new service information.
            </p>

            <form className="newsletter-form">

              <div className="newsletter-input-icon">
                <Mail size={13} />
              </div>

              <input
                type="email"
                placeholder="Your email address"
              />

              <button type="submit" aria-label="Subscribe">
                <ArrowRight size={14} />
              </button>

            </form>

          </div>

        </div>

        <div className="footer-bottom">

          <span>
            © {new Date().getFullYear()} BukzEx.
            All rights reserved.
          </span>

          <div className="footer-bottom-links">
            <a href="#">Privacy</a>
            <span>•</span>
            <a href="#">Terms</a>
          </div>

          <span className="footer-made">
            Digital services, simplified.
          </span>

        </div>

      </div>

    </footer>
  );
}
