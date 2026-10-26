import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const pageNames = {
  "/": "Your digital world, connected",
  "/login": "Welcome back",
  "/signup": "Create your account",
  "/reset-password": "Reset your password",
  "/auth/action": "Account verification",
  "/customer": "Your overview",
  "/customer/services": "Everyday services",
  "/customer/orders": "Your purchases",
  "/customer/crypto": "Crypto wallet",
  "/customer/profile": "Your profile",
  "/customer/settings": "Your settings",
  "/admin": "Administration",
  "/preview": "Responsive preview",
};
// Keep navigation predictable, including on phones and when opening review dialogs.
export default function RouteExperience() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = `BukzEx — ${pageNames[pathname] || (pathname.endsWith("/checkout") ? "Checkout" : "Choose your service")}`;
    if (hash)
      requestAnimationFrame(() =>
        document.getElementById(hash.slice(1))?.scrollIntoView(),
      );
    else window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);

  useEffect(() => {
    let activeDialog = null;
    let previousFocus = null;
    let previousOverflow = "";
    const selector =
      ".bx-crypto-modal,.admin-customer-modal,.admin-deposit-modal,.admin-order-modal,.admin-transaction-modal,.admin-crypto-modal";
    const focusable = () =>
      activeDialog
        ? [
            ...activeDialog.querySelectorAll(
              'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
            ),
          ].filter((node) => node.getClientRects().length)
        : [];
    const syncDialog = () => {
      const next = document.querySelector(selector);
      if (next === activeDialog) return;
      if (activeDialog) {
        document.body.style.overflow = previousOverflow;
        if (previousFocus?.isConnected) previousFocus.focus();
      }
      activeDialog = next;
      if (!next) return;
      previousFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      next.setAttribute("role", "dialog");
      next.setAttribute("aria-modal", "true");
      const heading = next.querySelector("h2,h3");
      if (heading) {
        if (!heading.id) heading.id = "bx-active-dialog-title";
        next.setAttribute("aria-labelledby", heading.id);
      }
      next.tabIndex = -1;
      (focusable()[0] || next).focus();
    };
    const onKey = (event) => {
      if (!activeDialog) return;
      if (event.key === "Escape") {
        const closeButton = activeDialog.querySelector(
          'button[aria-label^="Close"],header>button,[class$="modal-header"]>button,.bx-crypto-panel-title>button',
        );
        if (closeButton) {
          event.preventDefault();
          closeButton.click();
        }
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0],
        last = elements.at(-1);
      if (!first) {
        event.preventDefault();
        activeDialog.focus();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === activeDialog)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === activeDialog)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    const observer = new MutationObserver(syncDialog);
    observer.observe(document.getElementById("root"), {
      childList: true,
      subtree: true,
    });
    document.addEventListener("keydown", onKey);
    syncDialog();
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", onKey);
      if (activeDialog) document.body.style.overflow = previousOverflow;
    };
  }, []);
  return null;
}
