import { Package2 } from "lucide-react";
import "./ServiceBrandMark.css";

const BRANDS = [
  [/netflix/i, "N", "#e50914"],
  [/spotify/i, "S", "#1db954"],
  [/youtube|prime video/i, "▶", "#ff0033"],
  [/tiktok/i, "♪", "#111827"],
  [/coursera/i, "C", "#0056d2"],
  [/proton/i, "P", "#6d4aff"],
  [/instagram/i, "IG", "#c13584"],
  [/facebook|meta/i, "f", "#0866ff"],
  [/whatsapp/i, "WA", "#25d366"],
  [/airtel/i, "A", "#e40000"],
  [/(^|\W)mtn(\W|$)/i, "MTN", "#ffcc00"],
  [/(^|\W)glo(\W|$)/i, "G", "#00a650"],
  [/9mobile/i, "9", "#00a859"],
  [/dstv/i, "D", "#0065b3"],
  [/gotv/i, "G", "#f5a000"],
  [/startimes/i, "S", "#168447"],
  [/amazon/i, "a", "#232f3e"],
  [/apple/i, "A", "#51545a"],
  [/chatgpt|openai/i, "AI", "#10a37f"],
  [/perplexity/i, "P", "#2458a6"],
  [/snapchat/i, "SC", "#fffc00"],
  [/google|gmail|youtube/i, "G", "#4285f4"],
  [/telegram/i, "T", "#229ed9"],
  [/(^|\W)x(\W|$)|twitter/i, "X", "#171717"],
];

export default function ServiceBrandMark({
  name = "",
  logoUrl = "",
  fallbackIcon: FallbackIcon = Package2,
  size = "medium",
}) {
  const brand = BRANDS.find(([pattern]) => pattern.test(String(name)));
  const initials = brand?.[1] || String(name).trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "B";
  const color = brand?.[2] || "#315fa9";

  return (
    <span
      className={`service-brand-mark service-brand-mark-${size}`}
      style={{ "--service-brand-color": color }}
      aria-hidden="true"
    >
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          onError={(event) => { event.currentTarget.style.display = "none"; }}
        />
      )}
      {brand ? <span className="service-brand-initials">{initials}</span> : <FallbackIcon size={size === "small" ? 16 : 20} />}
    </span>
  );
}
