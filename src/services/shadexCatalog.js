export const WORKER_URL = "https://bukzex-shadex-catalog.uzongwashedrackdaberechukwu.workers.dev";

const CATALOGUE_PATHS = {
  vtu: "vtu",
  bills: "bills",
  marketplace: "marketplace",
  sms: "otp",
  social: "social-boost",
  email_verification: "email-verification/services",
};

async function readResponse(response, fallback) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("ShadexGoLtd returned an unreadable response.");
  }

  if (!response.ok || payload?.success !== true || !payload?.data) {
    throw new Error(payload?.error?.message || fallback);
  }

  return payload.data;
}

export async function getShadexCatalogue(serviceId) {
  const path = CATALOGUE_PATHS[serviceId];
  if (!path) throw new Error("This service has no ShadexGoLtd catalogue route.");

  const response = await fetch(`${WORKER_URL}/api/catalog/${path}`, {
    headers: { Accept: "application/json" },
  });

  return readResponse(response, "The live service catalogue could not be loaded.");
}

export async function getEmailVerificationDomains(serviceId) {
  const query = new URLSearchParams({ service_id: String(serviceId || "") });
  const response = await fetch(
    `${WORKER_URL}/api/catalog/email-verification/domains?${query}`,
    { headers: { Accept: "application/json" } },
  );

  return readResponse(response, "Email types could not be loaded.");
}

export function getVtuCatalogue() {
  return getShadexCatalogue("vtu");
}
