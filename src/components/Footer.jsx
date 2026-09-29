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
import { useState } from "react";

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
  { name: "About Us", href: "#about" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Contact Us", href: "#faq" },
  { name: "FAQ", href: "#faq" },
];

const supportLinks = [
  { name: "Help Center", href: "#faq" },
];

export default function Footer() {
  const [notice, setNotice] = useState("");

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
              <span>Social channels will be linked here soon.</span>
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
              <a href={link.href} key={link.name}>
                {link.name}
              </a>
            ))}

          </div>

          {/* SUPPORT */}

          <div className="footer-column">

            <h3>Support</h3>

            {supportLinks.map((link) => (
              <a href={link.href} key={link.name}>
                {link.name}
              </a>
            ))}
            <button type="button" onClick={() => setNotice("Terms of Service will be published before account services launch.")}>Terms of Service</button>
            <button type="button" onClick={() => setNotice("Privacy Policy will be published before account services launch.")}>Privacy Policy</button>

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

            <form
              className="newsletter-form"
              onSubmit={(event) => {
                event.preventDefault();
                setNotice("Email updates are not connected yet.");
              }}
            >

              <div className="newsletter-input-icon">
                <Mail size={13} />
              </div>

              <input
                type="email"
                placeholder="Your email address"
                aria-label="Your email address"
                required
              />

              <button type="submit" aria-label="Subscribe">
                <ArrowRight size={14} />
              </button>

            </form>
            {notice && <p role="status" className="footer-notice">{notice}</p>}

          </div>

        </div>

        <div className="footer-bottom">

          <span>
            © {new Date().getFullYear()} BukzEx.
            All rights reserved.
          </span>

          <div className="footer-bottom-links">
            <span>Privacy</span>
            <span>•</span>
            <span>Terms</span>
          </div>

          <span className="footer-made">
            Digital services, simplified.
          </span>

        </div>

      </div>

    </footer>
  );
}
