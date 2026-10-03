const UPSTREAM = "https://shadexgoltd.com/api/v1";
const FIREBASE_JWKS = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const FIRESTORE_URL = "https://firestore.googleapis.com/v1";
const SUPPORT_URL = "https://wa.me/2349161791736";
const CATALOG_ROUTES = new Map([
  ["/api/catalog/vtu", "/vtu/products"],
  ["/api/catalog/bills", "/bills/products"],
  ["/api/catalog/marketplace", "/marketplace/products"],
  ["/api/catalog/otp", "/otp/services"],
  ["/api/catalog/social-boost", "/social-boost/services"],
]);
const ORDER_ROUTES = {
  vtu: "/vtu/orders",
  bills: "/bills/orders",
  sms: "/otp/orders",
  social: "/social-boost/orders",
  marketplace: "/digital-services/orders",
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let jwksCache = null;
let oauthCache = null;

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = new Set([env.BUKZEX_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"].filter(Boolean));
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Idempotency-Key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  });
  if (allowed.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function json(body, status, cors) {
  const headers = new Headers(cors);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
}

function b64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function verifyFirebaseToken(request, env) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new HttpError(401, "Sign in to continue.");
  const parts = token.split(".");
  if (parts.length !== 3) throw new HttpError(401, "Your sign-in has expired. Sign in again.");
  let header;
  let claims;
  try {
    header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
    claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
  } catch {
    throw new HttpError(401, "Your sign-in has expired. Sign in again.");
  }
  const projectId = env.FIREBASE_PROJECT_ID || "bukzex";
  const now = Math.floor(Date.now() / 1000);
  if (header.alg !== "RS256" || !header.kid || claims.aud !== projectId
    || claims.iss !== `https://securetoken.google.com/${projectId}`
    || !claims.sub || claims.sub.length > 128 || Number(claims.exp) <= now
    || !Number.isFinite(Number(claims.iat)) || Number(claims.iat) > now + 60) {
    throw new HttpError(401, "Your sign-in is invalid or expired. Sign in again.");
  }
  if (!jwksCache || jwksCache.expiresAt < now) {
    const keyResponse = await fetch(FIREBASE_JWKS, { headers: { Accept: "application/json" } });
    if (!keyResponse.ok) throw new HttpError(503, "Sign-in could not be verified right now.");
    jwksCache = { keys: (await keyResponse.json()).keys || [], expiresAt: now + 3600 };
  }
  const jwk = jwksCache.keys.find((key) => key.kid === header.kid);
  if (!jwk) {
    jwksCache = null;
    throw new HttpError(401, "Your sign-in key could not be verified. Sign in again.");
  }
  const publicKey = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, decodeBase64Url(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!valid) throw new HttpError(401, "Your sign-in could not be verified. Sign in again.");
  return { uid: claims.sub };
}

async function serviceAccountToken(env) {
  if (oauthCache && oauthCache.expiresAt > Date.now() + 60000) return oauthCache.token;
  let account;
  try { account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON || ""); }
  catch { throw new HttpError(503, "BukzEx checkout is not configured yet."); }
  if (!account.client_email || !account.private_key) throw new HttpError(503, "BukzEx checkout is not configured yet.");

  const issued = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })))}.${b64url(new TextEncoder().encode(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: OAUTH_TOKEN_URL,
    iat: issued,
    exp: issued + 3600,
  })))}`;
  const pem = account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const privateKeyBytes = Uint8Array.from(atob(pem), (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", privateKeyBytes, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${b64url(new Uint8Array(signature))}`;
  const response = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) throw new HttpError(503, "BukzEx checkout could not connect to its wallet securely.");
  oauthCache = { token: payload.access_token, expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000 };
  return oauthCache.token;
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeValue(item)])) } };
}

function decodeValue(value) {
  if (!value || typeof value !== "object") return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in value) return decodeFields(value.mapValue.fields || {});
  return null;
}

function decodeFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function docResource(env, path) {
  return `projects/${env.FIREBASE_PROJECT_ID || "bukzex"}/databases/(default)/documents/${path}`;
}

function firestoreUrl(resource) {
  const encoded = resource.split("/").map((part, index) => index < 6 ? part : encodeURIComponent(part)).join("/");
  return `${FIRESTORE_URL}/${encoded}`;
}

async function firestoreGet(env, resource) {
  const token = await serviceAccountToken(env);
  const response = await fetch(firestoreUrl(resource), { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 404) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new HttpError(503, "BukzEx could not read the wallet or service price.");
  return { data: decodeFields(payload.fields), updateTime: payload.updateTime, raw: payload };
}

async function firestoreCommit(env, writes) {
  const token = await serviceAccountToken(env);
  const response = await fetch(`${FIRESTORE_URL}/${docResource(env, "").replace(/\/documents\/$/, "/documents:commit")}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ writes }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const status = payload?.error?.status;
    if (status === "ABORTED" || status === "FAILED_PRECONDITION" || status === "ALREADY_EXISTS") {
      throw new HttpError(409, "This checkout changed while being processed. Refresh and try again.");
    }
    throw new HttpError(503, "BukzEx could not safely save the wallet payment.");
  }
  return payload;
}

function updateWrite(env, path, data, updateTime, fields = Object.keys(data)) {
  return {
    update: { name: docResource(env, path), fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)])) },
    updateMask: { fieldPaths: fields },
    currentDocument: { updateTime },
  };
}

function createWrite(env, path, data) {
  return {
    update: { name: docResource(env, path), fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)])) },
    currentDocument: { exists: false },
  };
}

function amountMajor(minor, unit) {
  return Number((Number(minor) / (10 ** Number(unit))).toFixed(Number(unit)));
}

function mapProviderBody(serviceKey, itemId, inputs, recipientType, data, requestedAmount) {
  if (serviceKey === "vtu") return [ORDER_ROUTES.vtu, {
    service_type: inputs.service_type,
    network_id: inputs.network_id,
    ...(inputs.service_type === "data" ? { data_plan_id: itemId } : { amount: requestedAmount }),
    phone_number: inputs.phone_number,
  }];
  if (serviceKey === "bills") return [ORDER_ROUTES.bills, {
    plan_id: itemId,
    customer_identifier: inputs.customer_identifier,
    phone_number: inputs.phone_number,
    ...(inputs.variable_amount === true ? { amount: requestedAmount } : {}),
  }];
  if (serviceKey === "sms") return [ORDER_ROUTES.sms, { service_id: itemId }];
  if (serviceKey === "social") return [ORDER_ROUTES.social, { package_id: itemId, target_link: inputs.target_link }];
  return [ORDER_ROUTES.marketplace, {
    plan_id: itemId,
    recipient_type: recipientType,
    recipient_name: recipientType === "friend" ? data.recipient_name : null,
    recipient_phone: recipientType === "friend" ? data.recipient_phone : null,
    recipient_email: recipientType === "friend" ? data.recipient_email : null,
    account_name: inputs.account_name || null,
    account_email: inputs.account_email || null,
  }];
}

async function callShadex(env, path, method, idempotencyKey, body) {
  if (!env.SHADEX_API_KEY) throw new HttpError(503, "Service ordering is not configured yet.");
  const response = await fetch(`${UPSTREAM}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.SHADEX_API_KEY}`,
      Accept: "application/json",
      ...(method === "POST" ? { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey } : {}),
    },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
  return { response, payload: await response.json().catch(() => null) };
}

function safeMessage(payload, fallback) {
  return String(payload?.error?.message || payload?.message || fallback).slice(0, 220);
}

async function refundOnce(env, uid, idempotencyKey, message) {
  const requestPath = `shadex_purchase_requests/${uid}_${idempotencyKey}`;
  const request = await firestoreGet(env, docResource(env, requestPath));
  if (!request || request.data.status === "refunded") return;
  if (request.data.status !== "processing") return;
  const [wallet, order] = await Promise.all([
    firestoreGet(env, docResource(env, `wallets/${uid}`)),
    firestoreGet(env, docResource(env, `orders/${request.data.order_id}`)),
  ]);
  if (!wallet || !order) throw new HttpError(503, "The supplier rejected the order; refund confirmation is pending. Contact BukzEx Customer Care.");
  const amount = amountMajor(request.data.amount_minor, request.data.minor_unit);
  const restored = Number((Number(wallet.data.balance || 0) + amount).toFixed(request.data.minor_unit));
  const now = new Date().toISOString();
  await firestoreCommit(env, [
    updateWrite(env, `wallets/${uid}`, { balance: restored, updated_at: now }, wallet.updateTime),
    updateWrite(env, requestPath, { status: "refunded", message, updated_at: now }, request.updateTime),
    updateWrite(env, `orders/${request.data.order_id}`, { status: "failed", payment_status: "refunded", fulfillment_status: "failed", admin_note: message, updated_at: now }, order.updateTime),
    createWrite(env, `wallet_transactions/refund_${uid}_${idempotencyKey}`, {
      user_id: uid, transaction_type: "refund", amount, currency: request.data.currency,
      status: "completed", source_id: request.data.order_id,
      description: "Refund: ShadexGoLtd could not accept this purchase", created_at: now,
    }),
  ]);
}

async function purchase(request, env) {
  const identity = await verifyFirebaseToken(request, env);
  const uid = identity.uid;
  // Refuse checkout before touching the wallet if the supplier credential
  // is missing. This prevents paid orders being left in processing forever.
  if (!env.SHADEX_API_KEY) throw new HttpError(503, "BukzEx checkout is temporarily unavailable. Please try again later.");
  let data;
  try { data = await request.json(); } catch { throw new HttpError(400, "Checkout details are invalid."); }
  const serviceKey = String(data.service_key || "").trim();
  const itemId = String(data.item_id || "").trim();
  const idempotencyKey = String(data.idempotency_key || request.headers.get("Idempotency-Key") || "").trim();
  const recipientType = String(data.recipient_type || "self").toLowerCase();
  const inputs = data.inputs && typeof data.inputs === "object" ? data.inputs : {};
  const recipientName = String(data.recipient_name || "").trim().slice(0, 120);
  const recipientPhone = String(data.recipient_phone || "").trim().slice(0, 40);
  const recipientEmail = String(data.recipient_email || "").trim().toLowerCase().slice(0, 320);
  if (!UUID.test(idempotencyKey) || !itemId || itemId.length > 500) throw new HttpError(400, "The selected item or payment reference is invalid.");
  if (!ORDER_ROUTES[serviceKey]) throw new HttpError(400, "This service is not supported for checkout yet.");
  if (!["self", "friend"].includes(recipientType)) throw new HttpError(400, "Choose yourself or a friend.");
  if (recipientType === "friend" && (!recipientName || (!recipientPhone && !recipientEmail))) throw new HttpError(400, "Enter your friend's name and phone or email.");
  if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) throw new HttpError(400, "Enter a valid recipient email.");
  if (serviceKey === "vtu" && (!inputs.phone_number || !inputs.network_id || !["airtime", "data"].includes(String(inputs.service_type)))) throw new HttpError(400, "Choose airtime or data, a network and a phone number.");
  if (serviceKey === "bills" && (!inputs.customer_identifier || !inputs.phone_number)) throw new HttpError(400, "Enter the bill reference and phone number.");
  if (serviceKey === "social" && !String(inputs.target_link || "").trim()) throw new HttpError(400, "Enter the profile or post link for this service.");

  const reqPath = `shadex_purchase_requests/${uid}_${idempotencyKey}`;
  const orderId = `shadex_${uid}_${idempotencyKey}`;
  const orderPath = `orders/${orderId}`;
  const walletPath = `wallets/${uid}`;
  let savedRequest = await firestoreGet(env, docResource(env, reqPath));
  let amountMinor;
  let minorUnit;
  let currency;
  let serviceName;

  if (savedRequest) {
    const prior = savedRequest.data;
    if (prior.user_id !== uid || prior.service_key !== serviceKey || prior.item_id !== itemId
      || prior.recipient_type !== recipientType
      || (prior.recipient_name || "") !== (recipientType === "friend" ? recipientName : "")
      || (prior.recipient_phone || "") !== (recipientType === "friend" ? recipientPhone : "")
      || (prior.recipient_email || "") !== (recipientType === "friend" ? recipientEmail : "")
      || JSON.stringify(prior.request_data || {}) !== JSON.stringify(inputs)) {
      throw new HttpError(409, "This payment reference was already used for different checkout details.");
    }
    if (prior.status === "refunded") throw new HttpError(409, "This payment was refunded. Start a new checkout.");
    amountMinor = Number(prior.amount_minor);
    minorUnit = Number(prior.minor_unit);
    currency = String(prior.currency || "NGN");
    serviceName = String(prior.service_name || "BukzEx service");
  } else {
    const service = await firestoreGet(env, docResource(env, `services/${serviceKey}`));
    const wallet = await firestoreGet(env, docResource(env, walletPath));
    if (!service || service.data.status !== "active") throw new HttpError(409, "This service is not available right now.");
    if (!wallet || String(wallet.data.currency || "NGN") !== "NGN") throw new HttpError(409, "Your BukzEx NGN wallet could not be found.");
    const encodedId = encodeURIComponent(itemId);
    const price = await firestoreGet(env, docResource(env, `services/${serviceKey}/prices/${encodedId}`));
    const markup = Number(service.data.price_markup_percent || 0);
    const requestedAmount = Number(inputs.amount || 0);
    const feeItem = `fee-${String(inputs.provider_id || "")}`;
    const feePrice = serviceKey === "bills" && inputs.variable_amount === true
      ? await firestoreGet(env, docResource(env, `services/${serviceKey}/prices/${encodeURIComponent(feeItem)}`))
      : null;
    let chargeMajor;
    if (serviceKey === "vtu" && String(inputs.service_type) === "airtime") {
      if (!inputs.phone_number || !inputs.network_id || !Number.isFinite(requestedAmount) || requestedAmount < 50 || requestedAmount > 1000000) throw new HttpError(400, "Enter a valid airtime amount, network and phone number.");
      chargeMajor = requestedAmount * (1 + markup / 100);
      serviceName = `Airtime · ${String(inputs.network_name || "Network")}`;
    } else if (serviceKey === "bills" && inputs.variable_amount === true) {
      if (!inputs.customer_identifier || !inputs.phone_number || requestedAmount < 100 || requestedAmount > 10000000) throw new HttpError(400, "Enter the bill reference, phone number and amount.");
      const fee = feePrice?.data || service.data.bukzex_prices?.[feeItem];
      const feeMajor = fee && fee.is_active !== false ? Number(fee.amount_minor) / (10 ** Number(fee.minor_unit ?? 2)) : 0;
      chargeMajor = requestedAmount * (1 + markup / 100) + feeMajor;
      serviceName = String(inputs.item_name || "Bill payment");
    } else {
      const savedPrice = price?.data || service.data.bukzex_prices?.[itemId];
      if (!savedPrice || savedPrice.is_active === false || !Number.isSafeInteger(Number(savedPrice.amount_minor)) || Number(savedPrice.amount_minor) <= 0) throw new HttpError(409, "This item has no active BukzEx price yet.");
      amountMinor = Number(savedPrice.amount_minor);
      minorUnit = Number(savedPrice.minor_unit ?? 2);
      currency = String(savedPrice.currency || "NGN");
      chargeMajor = amountMinor / (10 ** minorUnit);
      serviceName = String(savedPrice.item_name || inputs.item_name || "BukzEx service");
    }
    currency ||= "NGN";
    minorUnit ??= 2;
    if (currency !== "NGN" || minorUnit !== 2) throw new HttpError(409, "This service is not priced in NGN.");
    amountMinor = Math.round(chargeMajor * 100);
    const charge = amountMinor / 100;
    const balance = Number(wallet.data.balance || 0);
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new HttpError(400, "The service price is invalid.");
    if (!Number.isFinite(balance) || Math.round(balance * 100) < amountMinor) throw new HttpError(402, "Your wallet balance is too low for this purchase.");
    const now = new Date().toISOString();
    const order = {
      user_id: uid, service_key: serviceKey, service_name: serviceName,
      requested_amount: charge, amount_minor: amountMinor, currency, minor_unit: minorUnit,
      provider: "ShadexGoLtd", status: "processing", payment_status: "paid", fulfillment_status: "processing",
      recipient_type: recipientType, recipient_name: recipientType === "friend" ? recipientName : null,
      supplier_order_id: null, service_email: null, support_url: SUPPORT_URL,
      created_at: now, updated_at: now,
    };
    savedRequest = {
      user_id: uid, service_key: serviceKey, item_id: itemId, service_name: serviceName,
      order_id: orderId, idempotency_key: idempotencyKey, amount_minor: amountMinor,
      minor_unit: minorUnit, currency, request_data: inputs, recipient_type: recipientType,
      recipient_name: recipientType === "friend" ? recipientName : null,
      recipient_phone: recipientType === "friend" ? recipientPhone : null,
      recipient_email: recipientType === "friend" ? recipientEmail : null,
      status: "processing", created_at: now, updated_at: now,
    };
    await firestoreCommit(env, [
      updateWrite(env, walletPath, { balance: Number((balance - charge).toFixed(2)), updated_at: now }, wallet.updateTime),
      createWrite(env, orderPath, order),
      createWrite(env, reqPath, savedRequest),
      createWrite(env, `wallet_transactions/purchase_${uid}_${idempotencyKey}`, {
        user_id: uid, transaction_type: "purchase", amount: charge, currency,
        status: "completed", source_id: orderId,
        description: `BukzEx service purchase: ${serviceName}`, created_at: now,
      }),
    ]);
  }

  const existingOrder = await firestoreGet(env, docResource(env, orderPath));
  if (existingOrder?.data.fulfillment_status === "fulfilled" || existingOrder?.data.status === "active" || existingOrder?.data.status === "completed") {
    return { order_id: orderId, status: existingOrder.data.status, service_email: existingOrder.data.service_email || null, message: "This purchase is already in your BukzEx Stack." };
  }

  const requestedAmount = Number(inputs.amount || 0);
  const [path, body] = mapProviderBody(serviceKey, itemId, inputs, recipientType, { ...data, recipient_name: recipientName, recipient_phone: recipientPhone, recipient_email: recipientEmail }, requestedAmount);
  let result;
  try { result = await callShadex(env, path, "POST", idempotencyKey, body); }
  catch { return { order_id: orderId, status: "processing", message: "Your payment is reserved while BukzEx confirms the service. Check My Stack before trying again." }; }

  if (!result.response.ok || result.payload?.success !== true) {
    if ([400, 401, 402, 403, 409, 422].includes(result.response.status)) {
      const message = safeMessage(result.payload, "The service provider could not accept this order.");
      await refundOnce(env, uid, idempotencyKey, message);
      throw new HttpError(422, `${message} Your BukzEx wallet has been refunded.`);
    }
    return { order_id: orderId, status: "processing", message: "Your payment is reserved while BukzEx confirms the service. Check My Stack before trying again." };
  }

  const upstream = result.payload.data?.order || result.payload.data || {};
  const supplierOrderId = String(upstream.id || upstream.order_id || "");
  const serviceEmail = upstream.login_email || upstream.service_email || null;
  const providerStatus = String(upstream.status || "processing").toLowerCase();
  const completed = ["active", "completed", "success", "successful"].includes(providerStatus);
  const now = new Date().toISOString();
  const [order, requestRow] = await Promise.all([
    firestoreGet(env, docResource(env, orderPath)),
    firestoreGet(env, docResource(env, reqPath)),
  ]);
  if (!order || !requestRow) throw new HttpError(503, "The supplier accepted the order; stack update is pending. Refresh My Stack shortly.");
  await firestoreCommit(env, [
    updateWrite(env, orderPath, {
      supplier_order_id: supplierOrderId || null,
      service_email: serviceEmail ? String(serviceEmail).slice(0, 320) : null,
      status: completed ? "completed" : "processing",
      fulfillment_status: completed ? "fulfilled" : "processing",
      supplier_status: providerStatus, support_url: SUPPORT_URL, updated_at: now,
    }, order.updateTime),
    updateWrite(env, reqPath, {
      status: "completed", supplier_order_id: supplierOrderId || null, updated_at: now,
    }, requestRow.updateTime),
  ]);
  return {
    order_id: orderId, status: completed ? "completed" : "processing",
    service_email: serviceEmail || null,
    message: serviceEmail
      ? "Payment complete. Your service email is in My Stack. Contact BukzEx Customer Care for password or OTP help."
      : "Payment complete. Your order is in My Stack. Contact BukzEx Customer Care for delivery or OTP help.",
  };
}

async function refreshOrder(request, env) {
  const { uid } = await verifyFirebaseToken(request, env);
  const body = await request.json().catch(() => ({}));
  const orderId = String(body.order_id || "");
  if (!orderId.startsWith(`shadex_${uid}_`)) throw new HttpError(404, "This BukzEx order was not found.");
  const path = `orders/${orderId}`;
  const order = await firestoreGet(env, docResource(env, path));
  if (!order || order.data.user_id !== uid) throw new HttpError(404, "This BukzEx order was not found.");
  if (!order.data.supplier_order_id) return { order_id: orderId, status: order.data.status, service_email: order.data.service_email || null };
  const { response, payload } = await callShadex(env, `/orders/${encodeURIComponent(order.data.supplier_order_id)}`, "GET", "", null);
  const upstream = payload?.data?.order || payload?.data;
  if (!response.ok || !upstream) throw new HttpError(503, "The order status is temporarily unavailable. Try again shortly.");
  const active = Boolean(upstream.login_email || upstream.service_email) && String(upstream.status).toLowerCase() === "active";
  const now = new Date().toISOString();
  const serviceEmail = upstream.login_email || upstream.service_email || null;
  await firestoreCommit(env, [updateWrite(env, path, {
    service_email: serviceEmail ? String(serviceEmail).slice(0, 320) : null,
    status: active ? "active" : "processing",
    fulfillment_status: active ? "fulfilled" : "processing",
    stack_id: upstream.stack_id || null,
    service_starts_at: upstream.starts_at || null,
    service_ends_at: upstream.ends_at || null,
    updated_at: now,
  }, order.updateTime)]);
  return { order_id: orderId, status: active ? "active" : "processing", service_email: serviceEmail || null };
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") {
      if (origin && !cors.has("Access-Control-Allow-Origin")) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: cors });
    }
    if (origin && !cors.has("Access-Control-Allow-Origin")) return json({ error: "origin_not_allowed" }, 403, cors);
    const url = new URL(request.url);
    if (request.method === "GET" && CATALOG_ROUTES.has(url.pathname)) {
      if (!env.SHADEX_API_KEY) return json({ error: "provider_key_not_configured" }, 503, cors);
      try {
        const upstream = await fetch(`${UPSTREAM}${CATALOG_ROUTES.get(url.pathname)}`, {
          headers: { Authorization: `Bearer ${env.SHADEX_API_KEY}`, Accept: "application/json" },
        });
        return new Response(await upstream.text(), {
          status: upstream.status,
          headers: new Headers({ ...Object.fromEntries(cors), "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8", "Cache-Control": "no-store" }),
        });
      } catch { return json({ error: "provider_unreachable" }, 502, cors); }
    }
    if (request.method === "POST" && ["/api/checkout/purchase", "/api/checkout/order-refresh"].includes(url.pathname)) {
      try {
        const body = url.pathname.endsWith("order-refresh") ? await refreshOrder(request, env) : await purchase(request, env);
        return json({ success: true, data: body }, 200, cors);
      } catch (error) {
        const status = error instanceof HttpError ? error.status : 500;
        return json({ success: false, error: { message: error instanceof HttpError ? error.message : "BukzEx could not complete the request." } }, status, cors);
      }
    }
    return json({ error: "not_found" }, 404, cors);
  },
};
