import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Smartphone,
  Receipt,
  Store,
  MessageSquareCode,
  Mail,
  TrendingUp,
  Bitcoin,
  ShieldCheck,
  Layers3,
  Menu,
  X,
  Plus,
  Minus,
  WalletCards,
  Check,
  Headphones,
} from "lucide-react";
import Brand from "../components/Brand";
import WhatsAppSupport from "../components/WhatsAppSupport";

const services = [
  {
    id: "vtu",
    title: "Airtime & data",
    detail: "Top up a phone. Find the right data plan.",
    category: "CONNECT",
    icon: Smartphone,
  },
  {
    id: "bills",
    title: "Bills & utilities",
    detail: "Electricity and cable TV, handled in one place.",
    category: "PAY",
    icon: Receipt,
  },
  {
    id: "marketplace",
    title: "Digital subscriptions",
    detail: "Explore available streaming, music and digital plans.",
    category: "SUBSCRIBE",
    icon: Store,
  },
  {
    id: "sms",
    title: "Virtual numbers",
    detail: "Supported SMS verification services across countries.",
    category: "VERIFY",
    icon: MessageSquareCode,
  },
  {
    id: "rental",
    title: "Number rentals",
    detail: "Longer-term virtual numbers with monthly billing.",
    category: "RENT",
    icon: Smartphone,
  },
  {
    id: "email_verification",
    title: "Email verification",
    detail: "Temporary email options and verification codes.",
    category: "VERIFY",
    icon: Mail,
  },
  {
    id: "social",
    title: "Social media services",
    detail: "Browse available packages for your social accounts.",
    category: "GROW",
    icon: TrendingUp,
  },
];
const faqs = [
  [
    "How do I get started?",
    "Create an account and confirm your email address. Sign in to explore services, add money to your wallet and manage your purchases.",
  ],
  [
    "How do I fund my wallet?",
    "Choose Top up wallet on your dashboard. Transfer using the displayed bank details and submit your amount and transfer reference. Your wallet is credited after the transfer is reviewed and confirmed.",
  ],
  [
    "Where are my purchases and verification codes?",
    "Open Purchases to follow your order status and view available account details, numbers and verification codes. Some services need time to complete.",
  ],
  [
    "Does every virtual number work with every app?",
    "Compatibility depends on the country, number and service selected, as well as the receiving platform’s requirements. Review the available options before you pay.",
  ],
  [
    "How can I get help with an order?",
    "Contact BukzEx customer care on WhatsApp and include the order reference. Refund eligibility depends on the service and transaction status.",
  ],
];
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  return (
    <div className="bx-landing bx-shadex-home" data-bukzex-design="shadex-v8">
      <a className="bx-skip" href="#main-content">
        Skip to content
      </a>
      <header className="bx-public-header">
        <div className="bx-wrap bx-header-inner">
          <Brand />
          <nav
            id="public-navigation"
            aria-label="Main navigation"
            className={menuOpen ? "bx-public-nav is-open" : "bx-public-nav"}
          >
            {[
              ["#services", "Services"],
              ["#how-it-works", "How it works"],
              ["#about", "The BukzEx advantage"],
              ["#faq", "Help"],
            ].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <Link className="bx-mobile-login" to="/login">
              Sign in
            </Link>
          </nav>
          <div className="bx-header-actions">
            <Link className="bx-signin" to="/login">
              Sign in
            </Link>
            <Link className="bx-button bx-small" to="/signup">
              Open an account <ArrowUpRight size={16} />
            </Link>
            <button
              type="button"
              className="bx-menu"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-controls="public-navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main-content">
        <section className="sf-hero bx-wrap">
          <div className="sf-hero-copy">
            <span className="sf-eyebrow">
              <i /> YOUR DIGITAL SERVICES. CONNECTED.
            </span>
            <h1>
              One account.
              <br />
              Every digital <span>move.</span>
            </h1>
            <p>
              Airtime. Bills. Subscriptions. Verification. Bring your everyday
              digital services into one focused workspace.
            </p>
            <div className="sf-hero-actions">
              <Link className="bx-button" to="/signup">
                Create your BukzEx account <ArrowUpRight size={18} />
              </Link>
              <a className="sf-link" href="#services">
                Discover our services <ArrowRight size={17} />
              </a>
            </div>
            <div className="sf-hero-assurance">
              <ShieldCheck size={16} />
              <span>Review your options. See the price. Stay in control.</span>
            </div>
          </div>
          <div
            className="sf-product-view"
            aria-label="Illustration of the BukzEx workspace"
          >
            <div className="sf-product-toolbar">
              <Brand />
              <span>YOUR WORKSPACE</span>
              <span className="sf-toolbar-dots">
                <i />
                <i />
                <i />
              </span>
            </div>
            <div className="sf-product-body">
              <div className="sf-product-intro">
                <small>ONE BALANCE. MORE POSSIBILITIES.</small>
                <strong>Make your next move.</strong>
              </div>
              <div className="sf-product-wallet">
                <span>
                  <WalletCards size={19} /> BukzEx wallet
                </span>
                <strong>Ready for your everyday.</strong>
                <small>One balance for the services you choose.</small>
                <span className="sf-product-wallet-link">
                  Fund. Choose. Pay.
                  <ArrowUpRight size={17} />
                </span>
              </div>
              <div className="sf-product-shortcuts">
                {[
                  [Smartphone, "Airtime & data"],
                  [Receipt, "Bills & utilities"],
                  [MessageSquareCode, "Verification"],
                ].map(([Icon, label]) => (
                  <div key={label}>
                    <Icon size={20} />
                    <span>{label}</span>
                    <ArrowRight size={14} />
                  </div>
                ))}
              </div>
              <div className="sf-product-bottom">
                <span>
                  <Check size={14} /> Clear prices before checkout
                </span>
                <span>BUKZEX</span>
              </div>
            </div>
          </div>
        </section>
        <div className="sf-capability-strip">
          <div className="bx-wrap">
            <span>BUILT AROUND YOUR EVERYDAY</span>
            <span>
              <WalletCards size={17} /> Wallet payments
            </span>
            <span>
              <Layers3 size={17} /> Digital essentials
            </span>
            <span>
              <ShieldCheck size={17} /> Order tracking
            </span>
            <span>
              <Headphones size={17} /> Customer support
            </span>
          </div>
        </div>
        <section className="sf-services bx-wrap" id="services">
          <div className="sf-section-heading">
            <div>
              <span className="sf-eyebrow">THE SERVICE COLLECTION</span>
              <h2>
                Everything you need.
                <br />
                <span>One clear destination.</span>
              </h2>
            </div>
            <p>
              Choose a category. Explore the available options.
              <br />
              See your price before you continue.
            </p>
          </div>
          <div className="sf-services-directory">
            {services.map(({ id, title, detail, category, icon: Icon }, i) => (
              <Link
                className="sf-service-row"
                to={`/customer/services/${id}`}
                key={id}
              >
                <span className="sf-service-index">0{i + 1}</span>
                <span className="sf-service-symbol">
                  <Icon size={23} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </div>
                <span className="sf-service-category">{category}</span>
                <span className="sf-service-open">
                  <ArrowUpRight size={20} />
                </span>
              </Link>
            ))}
          </div>
          <Link className="sf-crypto-banner" to="/customer/crypto">
            <Bitcoin size={31} />
            <div>
              <small>BEYOND EVERYDAY PAYMENTS</small>
              <strong>Your crypto. Part of the picture.</strong>
              <p>Explore supported deposits and bank withdrawal requests.</p>
            </div>
            <span>
              Open crypto wallet <ArrowUpRight size={19} />
            </span>
          </Link>
        </section>
        <section className="sf-workflow" id="how-it-works">
          <div className="bx-wrap sf-workflow-layout">
            <div>
              <span className="sf-eyebrow">A SIMPLER WAY THROUGH</span>
              <h2>
                Less switching.
                <br />
                More <span>doing.</span>
              </h2>
              <p>
                Keep the essentials in one account.
                <br />
                Get on with the rest of your day.
              </p>
              <Link className="sf-link" to="/signup">
                Get started <ArrowRight size={17} />
              </Link>
            </div>
            <div className="sf-workflow-steps">
              {[
                [
                  "01",
                  "Open your account",
                  "Register, confirm your email and sign in to your workspace.",
                ],
                [
                  "02",
                  "Fund your wallet",
                  "Submit your transfer details. Your balance updates after confirmation.",
                ],
                [
                  "03",
                  "Make your next move",
                  "Choose a service, review its price and pay. Follow its progress in Purchases.",
                ],
              ].map(([n, title, detail]) => (
                <article key={n}>
                  <span>{n}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{detail}</p>
                  </div>
                  <Check size={18} />
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="sf-advantages bx-wrap" id="about">
          <div className="sf-section-heading">
            <div>
              <span className="sf-eyebrow">THE BUKZEX ADVANTAGE</span>
              <h2>
                A clearer view.
                <br />
                <span>A better everyday.</span>
              </h2>
            </div>
          </div>
          <div className="sf-advantages-grid">
            {[
              [
                WalletCards,
                "Your balance, together",
                "Use one wallet across available services. Keep your activity in a familiar workspace.",
              ],
              [
                Layers3,
                "Details that stay with you",
                "Find your purchase status and available delivery details without searching across apps.",
              ],
              [
                Headphones,
                "Support within reach",
                "Get account and order assistance from BukzEx customer care on WhatsApp.",
              ],
            ].map(([Icon, title, detail]) => (
              <article key={title}>
                <Icon size={25} />
                <h3>{title}</h3>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="sf-faq bx-wrap" id="faq">
          <div>
            <span className="sf-eyebrow">BEFORE YOUR NEXT MOVE</span>
            <h2>
              Good questions.
              <br />
              <span>Clear answers.</span>
            </h2>
            <a
              className="sf-link"
              href="https://wa.me/2349161791736"
              target="_blank"
              rel="noreferrer"
            >
              Speak to customer care <ArrowUpRight size={17} />
            </a>
          </div>
          <div>
            {faqs.map(([q, a], i) => (
              <article className="bx-faq-item" key={q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                  >
                    {q}
                    {openFaq === i ? <Minus size={18} /> : <Plus size={18} />}
                  </button>
                </h3>
                <div id={`faq-answer-${i}`} hidden={openFaq !== i}>
                  <p>{a}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="sf-cta bx-wrap">
          <div>
            <span className="sf-eyebrow">BUKZEX. YOUR NEXT MOVE.</span>
            <h2>
              Bring your digital
              <br />
              everyday <span>together.</span>
            </h2>
          </div>
          <div>
            <Link className="bx-button" to="/signup">
              Open your account <ArrowUpRight size={18} />
            </Link>
            <span>
              Already with us?{" "}
              <Link to="/login">
                Sign in <ArrowRight size={14} />
              </Link>
            </span>
          </div>
        </section>
      </main>
      <footer className="sf-footer bx-wrap">
        <div>
          <Brand />
          <p>Your digital world. Connected.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#services">Services</a>
          <a href="#how-it-works">How it works</a>
          <a href="#faq">Help centre</a>
          <Link to="/customer/orders">Purchases</Link>
        </nav>
        <div className="sf-footer-bottom">
          <span>© {new Date().getFullYear()} BukzEx. All rights reserved.</span>
          <span>Digital services. One workspace.</span>
        </div>
      </footer>
      <WhatsAppSupport />
    </div>
  );
}
