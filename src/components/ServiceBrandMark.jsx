import {
  AtSign,
  FileText,
  Globe2,
  Smartphone,
  Tv,
  Zap,
  TrendingUp,
  Package2,
} from "lucide-react";
import {
  FaApple, FaRobot,
  FaFacebookF,
  FaGoogle,
  FaInstagram,
  FaSpotify,
  FaTelegramPlane,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { SiBinance, SiNetflix, SiX } from "react-icons/si";
import {
  publicLogoUrl,
  publicText,
} from "../../bukzex-shadex-catalog-worker/src/public-catalogue.js";
const brands = [
  [/netflix/i, SiNetflix, "#f15b63"],
  [/spotify/i, FaSpotify, "#63dc93"],
  [/youtube/i, FaYoutube, "#ff747b"],
  [/tiktok/i, FaTiktok, "#e6edf7"],
  [/instagram/i, FaInstagram, "#ec9cc7"],
  [/facebook|meta/i, FaFacebookF, "#88baff"],
  [/whatsapp/i, FaWhatsapp, "#6fdda1"],
  [/telegram/i, FaTelegramPlane, "#8accff"],
  [/google|gmail/i, FaGoogle, "#9ebfff"],
  [/apple/i, FaApple, FaRobot, "#e4edf7"],
  [/chatgpt|openai/i, FaRobot, "#8bd7bc"],
  [/binance/i, SiBinance, "#e6ca75"],
  [/(^|\W)x(\W|$)|twitter/i, SiX, "#e6edf7"],
];
const fallbackIcons = [
  [/electric|energy|power|prepaid|postpaid/i,Zap],
  [/dstv|gotv|startimes|cable|television/i,Tv],
  [/mtn|airtel|9mobile|glo|airtime|data|rental|number/i,Smartphone],
  [/email|mail|126\.com/i,AtSign],
  [/\.com|\.net|\.org|\.io|\.ai/i,Globe2],
  [/social|boost|followers|views|likes/i,TrendingUp],
  [/pdf|document/i,FileText],
];
export default function ServiceBrandMark({
  name = "",
  logoUrl = "",
  fallbackIcon,
  size = "medium",
}) {
  const label = publicText(name);
  const brand = brands.find(([pattern]) => pattern.test(label));
  const Icon = brand?.[1] || fallbackIcon || fallbackIcons.find(([pattern]) => pattern.test(label))?.[1] || Package2;
  const safeLogo = publicLogoUrl(logoUrl);
  const network = /\bMTN\b/i.test(label)
    ? "MTN"
    : /\bGLO\b/i.test(label)
      ? "glo"
      : /airtel/i.test(label)
        ? "airtel"
        : null;
  return (
    <span
      className={`service-brand-mark service-brand-mark-${size}`}
      style={{ "--service-brand-color": brand?.[2] || "#e0c588" }}
      aria-hidden="true"
    >
      {network ? (
        <span className="service-brand-wordmark">{network}</span>
      ) : (
        <Icon
          size={size === "small" ? 20 : 24}
          aria-hidden="true"
          focusable="false"
        />
      )}
      {safeLogo && (
        <img
          src={safeLogo}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </span>
  );
}
