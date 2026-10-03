import { FaWhatsapp } from "react-icons/fa";
import "./WhatsAppSupport.css";

const supportNumber = "2349161791736";
const supportText = "Hello BukzEx Customer Care, I need help with my account.";

export default function WhatsAppSupport() {
  const href = `https://wa.me/${supportNumber}?text=${encodeURIComponent(supportText)}`;

  return (
    <a className="bukzex-whatsapp-support" href={href} target="_blank" rel="noreferrer"
      aria-label="Chat with BukzEx customer care on WhatsApp" title="Chat with BukzEx customer care">
      <FaWhatsapp aria-hidden="true" />
      <span>Need help?</span>
    </a>
  );
}
