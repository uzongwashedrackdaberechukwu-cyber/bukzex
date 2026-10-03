export const WORKER_URL = "https://bukzex-shadex-catalog.uzongwashedrackdaberechukwu.workers.dev";

const CATALOGUE_PATHS = {
  vtu: "vtu",
  bills: "bills",
  marketplace: "marketplace",
  sms: "otp",
  social: "social-boost",
};

export async function getShadexCatalogue(serviceId) {
  const path = CATALOGUE_PATHS[serviceId];
  if (!path) throw new Error("This service has no ShadexGoLtd catalogue route.");

  const response = await fetch(`${WORKER_URL}/api/catalog/${path}`, {
    headers: { Accept: "application/json" },
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("ShadexGoLtd returned an unreadable response.");
  }

  if (!response.ok || payload?.success !== true || !payload?.data) {
    throw new Error(
      payload?.error?.message || "The live service catalogue could not be loaded.",
    );
  }

  return payload.data;
}

export function getVtuCatalogue() {
  return getShadexCatalogue("vtu");
}
