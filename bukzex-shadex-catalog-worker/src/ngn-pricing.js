export function isNgnPrice(price) {
  return Boolean(price && price.currency === "NGN" && Number(price.minor_unit) === 2
    && price.minor_unit != null && price.amount_minor != null
    && Number.isSafeInteger(Number(price.amount_minor)) && Number(price.amount_minor) >= 0);
}

export function activeNgnPrice(price) {
  return isNgnPrice(price) && price.is_active !== false && Number(price.amount_minor) > 0;
}

// Preserve structural groups and destinations; remove only incompatible priced rows.
export function ngnCatalogue(data) {
  const market = data?.market;
  if (market && (market.currency !== "NGN" || Number(market.minorUnit ?? market.minor_unit) !== 2)) {
    throw new Error("The connector requires an NGN catalogue. Check the API account currency.");
  }
  function visit(value) {
    if (Array.isArray(value)) return value.map(visit).filter((row) => row !== undefined);
    if (!value || typeof value !== "object") return value;
    if (value.price && !isNgnPrice(value.price)) return undefined;
    if (value.amount_minor != null && !isNgnPrice(value)) return undefined;
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      const next = visit(child);
      if (next !== undefined) result[key] = next;
    }
    if (Array.isArray(value.prices) && !result.prices?.length) return undefined;
    return result;
  }
  return visit(data);
}
