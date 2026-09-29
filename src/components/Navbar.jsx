import { Link } from "react-router-dom";

import "./Navbar.css";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">

        <Link to="/" className="navbar-brand">
          <span className="brand-mark">B</span>

          <span className="brand-text">
            Bukz<span>Ex</span>
          </span>
        </Link>

        <nav className="navbar-links">
          <a href="/#home" className="active">
            Home
          </a>

          <a href="/#services">
            Services
          </a>

          <a href="/#how-it-works">
            How It Works
          </a>

          <a href="/#about">
            About
          </a>

          <a href="/#faq">
            FAQ
          </a>
        </nav>

        <div className="navbar-actions">

          <Link
            to="/login"
            className="navbar-login"
          >
            Log In
          </Link>

          <Link
            to="/signup"
            className="navbar-signup"
          >
            Sign Up
          </Link>

        </div>

      </div>
    </header>
  );
}
