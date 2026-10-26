// Public BukzEx contract. Never return raw upstream catalogue/error objects.
const PRIVATE_BRAND = /discount[\s._-]*zar/i;
const PRIVATE_BRANDS = /discount[\s._-]*zar|shadex\s*go\s*ltd/gi;
const INTERNAL_KEYS =
  /^(?:provider_name|supplier_name|upstream_name|provider_url|supplier_url|upstream_url|api_key|token|secret|authorization|raw|raw_response|upstream_response|provider_response|debug|stack|trace)$/i;
const IDENTIFIER_KEYS =
  /^(?:id|.*_id|identifier|.*_reference|.*_token|.*_hash|password|.*_password|.*_email|email_address|phone_number|account_number|deposit_address)$/i;
const CATALOGUE_KEYS = new Set([
  "market",
  "currency",
  "countryCode",
  "country_code",
  "country_name",
  "minorUnit",
  "minor_unit",
  "products",
  "services",
  "networks",
  "plans",
  "providers",
  "data",
  "airtime",
  "electricity",
  "cable",
  "domains",
  "id",
  "name",
  "title",
  "description",
  "short_description",
  "service_name",
  "service_slug",
  "category_name",
  "duration",
  "duration_unit",
  "logo_url",
  "image_url",
  "price",
  "amount_minor",
  "service_fee_minor",
  "network_id",
  "network_name",
  "network_code",
  "provider_id",
  "provider_product_id",
  "provider_service_id",
  "provider_server_id",
  "identifier",
  "plan_type",
  "variable_amount",
  "package_id",
  "package_name",
  "platform",
  "service_id",
  "quantity",
  "category",
  "minimum_months",
  "maximum_months",
  "stock_count",
  "domain_name",
  "is_active",
  "available",
  "availability",
  "status",
  "country",
  "code",
  "group_id",
  "group_name",
  "label",
  "value",
  "count",
  "total",
  "page",
  "page_size",
  "has_more",
  "next_cursor",
  "pagination",
]);
export function publicText(value) {
  return String(value ?? "").replace(PRIVATE_BRANDS, "BukzEx");
}
export function publicLogoUrl(value) {
  if (!value || PRIVATE_BRAND.test(String(value))) return "";
  try {
    const url = new URL(String(value));
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
function visit(value, key, catalogue) {
  if (Array.isArray(value))
    return value
      .map((item) => visit(item, key, catalogue))
      .filter((item) => item !== undefined);
  if (value && typeof value === "object") {
    const result = {};
    for (const [field, item] of Object.entries(value)) {
      if (
        ["__proto__", "constructor", "prototype"].includes(field) ||
        PRIVATE_BRAND.test(field) ||
        INTERNAL_KEYS.test(field) ||
        (catalogue && !CATALOGUE_KEYS.has(field))
      )
        continue;
      const next = visit(item, field, catalogue);
      if (next !== undefined) result[field] = next;
    }
    return result;
  }
  if (typeof value !== "string") return value;
  if (/^(?:logo_url|image_url)$/i.test(key))
    return publicLogoUrl(value) || undefined;
  if (PRIVATE_BRAND.test(value) && IDENTIFIER_KEYS.test(key)) {
    // Do not silently corrupt purchase IDs, credentials or routing references.
    throw new Error("The service response could not be safely displayed.");
  }
  return publicText(value);
}
export function publicApiResponse(payload) {
  const output = visit(payload, "", false);
  if (PRIVATE_BRAND.test(JSON.stringify(output)))
    throw new Error("The service response could not be safely displayed.");
  return output;
}
export function publicCatalogueData(data) {
  const output = visit(data, "", true);
  if (PRIVATE_BRAND.test(JSON.stringify(output)))
    throw new Error("The service catalogue is temporarily unavailable.");
  return output;
}
export async function catalogueResponse(upstream, cors = {}) {
  let payload;
  try {
    payload = await upstream.json();
  } catch {
    payload = null;
  }
  const headers = new Headers(cors);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  if (!upstream.ok || payload?.success !== true || payload.data == null) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "catalogue_unavailable",
          message:
            "This BukzEx service is temporarily unavailable. Please try again.",
        },
      }),
      { status: upstream.ok ? 502 : upstream.status, headers },
    );
  }
  try {
    return new Response(
      JSON.stringify({
        success: true,
        data: publicCatalogueData(payload.data),
      }),
      { status: upstream.status, headers },
    );
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "catalogue_unavailable",
          message:
            "This BukzEx service is temporarily unavailable. Please try again.",
        },
      }),
      { status: 502, headers },
    );
  }
}
