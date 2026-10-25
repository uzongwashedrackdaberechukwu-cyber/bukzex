import {
  Home,
  Layers3,
  ShoppingBag,
  UserRound,
  Bitcoin,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./CustomerWorkspaceNav.css";

const items = [
  { id: "home", label: "Home", to: "/customer", icon: Home },
  { id: "services", label: "Services", to: "/customer/services", icon: Layers3 },
  { id: "orders", label: "Purchases", to: "/customer/orders", icon: ShoppingBag },
  { id: "crypto", label: "Crypto", to: "/customer/crypto", icon: Bitcoin },
  { id: "profile", label: "Profile", to: "/customer/profile", icon: UserRound },
];

export default function CustomerWorkspaceNav({ current = "", name = "Customer", onLogout }) {
  return (
    <>
      <aside className="bx-customer-rail" aria-label="BukzEx customer navigation">
        <Link to="/customer" className="bx-customer-rail-brand" aria-label="BukzEx home">
          <span>B</span>
          <strong>Bukz<em>Ex</em></strong>
        </Link>

        <div className="bx-customer-rail-status">
          <span className="bx-customer-live-dot" />
          <div>
            <strong>Secure workspace</strong>
            <small>Wallet & services online</small>
          </div>
        </div>

        <nav className="bx-customer-rail-nav">
          <small>WORKSPACE</small>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.id} to={item.to} className={current === item.id ? "active" : ""}>
                <span><Icon size={18} /></span>
                <b>{item.label}</b>
              </Link>
            );
          })}
        </nav>

        <div className="bx-customer-rail-foot">
          <div className="bx-customer-rail-user">
            <span>{String(name || "C").charAt(0).toUpperCase()}</span>
            <div><strong>{name || "Customer"}</strong><small>Customer account</small></div>
          </div>
          <div className="bx-customer-protected"><ShieldCheck size={15} /> Protected checkout</div>
          {onLogout && (
            <button type="button" onClick={onLogout}><LogOut size={16} /> Sign out</button>
          )}
        </div>
      </aside>

      <header className="bx-customer-mobilebar">
        <Link to="/customer" className="bx-customer-mobile-brand"><span>B</span><strong>Bukz<em>Ex</em></strong></Link>
        <Link to="/customer/profile" className="bx-customer-mobile-profile" aria-label="Open profile"><UserRound size={18} /></Link>
      </header>

      <nav className="bx-customer-mobile-nav" aria-label="Mobile customer navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} to={item.to} className={current === item.id ? "active" : ""}>
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
