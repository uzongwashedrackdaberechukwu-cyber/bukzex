import "./index.css";
import "./design/landing.css";
import "./design/auth.css";
import "./design/workspace.css";
import "./design/admin.css";
import "./design/preview.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
