import {
  Home,
  Layers3,
  ShoppingBag,
  UserRound,
  Bitcoin,
  Settings,
  LogOut,
  ArrowUpRight,
  Headphones,
} from "lucide-react";
import { Link } from "react-router-dom";
import Brand from "./Brand";
const items = [
  { id: "home", label: "Overview", to: "/customer", icon: Home },
  {
    id: "services",
    label: "Services",
    to: "/customer/services",
    icon: Layers3,
  },
  {
    id: "orders",
    label: "Purchases",
    to: "/customer/orders",
    icon: ShoppingBag,
  },
  {
    id: "crypto",
    label: "Crypto wallet",
    to: "/customer/crypto",
    icon: Bitcoin,
  },
  {
    id: "profile",
    label: "My profile",
    to: "/customer/profile",
    icon: UserRound,
  },
];
export default function CustomerWorkspaceNav({
  current = "",
  name = "",
  onLogout,
}) {
  return (
    <>
      <aside className="bx-customer-rail" aria-label="Account navigation">
        <Brand to="/customer" />
        <div className="bx-workspace-label">YOUR EVERYDAY, TOGETHER.</div>
        <nav className="bx-customer-rail-nav">
          <small>MY WORKSPACE</small>
          {items.map(({ id, label, to, icon: Icon }) => (
            <Link
              key={id}
              to={to}
              className={current === id ? "active" : ""}
              aria-current={current === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {current === id && <i />}
            </Link>
          ))}
          <Link
            to="/customer/settings"
            className={current === "settings" ? "active" : ""}
            aria-current={current === "settings" ? "page" : undefined}
          >
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>
        <div className="bx-rail-help">
          <span>
            <Headphones size={20} />
          </span>
          <strong>A helping hand.</strong>
          <p>
            Here for the little things
            <br />
            and the tricky ones.
          </p>
          <a
            href="https://wa.me/2349161791736"
            target="_blank"
            rel="noreferrer"
          >
            Talk to us <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="bx-customer-rail-foot">
          <div className="bx-customer-rail-user">
            <span>
              {name ? (
                String(name).charAt(0).toUpperCase()
              ) : (
                <UserRound size={19} />
              )}
            </span>
            <div>
              <strong>{name || "Your account"}</strong>
              <small>Your BukzEx workspace</small>
            </div>
          </div>
          {onLogout && (
            <button type="button" onClick={onLogout}>
              <LogOut size={16} /> Sign out
            </button>
          )}
        </div>
      </aside>
      <header className="bx-customer-mobilebar">
        <Brand to="/customer" />
        <Link to="/customer/settings" aria-label="Account settings">
          <Settings size={20} />
        </Link>
      </header>
      <nav
        className="bx-customer-mobile-nav"
        aria-label="Mobile account navigation"
      >
        {items.map(({ id, label, to, icon: Icon }) => (
          <Link
            key={id}
            to={to}
            className={current === id ? "active" : ""}
            aria-current={current === id ? "page" : undefined}
          >
            <Icon size={20} />
            <span>
              {id === "crypto"
                ? "Crypto"
                : id === "profile"
                  ? "Profile"
                  : label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}
