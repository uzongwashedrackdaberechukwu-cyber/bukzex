import { Link } from "react-router-dom";
export default function Brand({ to = "/" }) {
  return (
    <Link className="bx-brand" to={to} aria-label="BukzEx home">
      <span className="bx-brand-mark">
        b<span>↗</span>
      </span>
      <span>
        Bukz<span>Ex</span>
        <i />
      </span>
    </Link>
  );
}
