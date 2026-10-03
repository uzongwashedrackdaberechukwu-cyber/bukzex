const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { defineSecret } = require("firebase-functions/params");
const { HttpsError, onCall } = require("firebase-functions/v2/https");

initializeApp();
const db = getFirestore();
const SHADEX_API_KEY = defineSecret("SHADEX_API_KEY");
const SHADEX_API_BASE_URL = "https://shadexgoltd.com/api/v1";
const SUPPORT_URL = "https://wa.me/2349161791736";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function amountMajor(amountMinor, minorUnit) {
  return Number((Number(amountMinor) / (10 ** Number(minorUnit))).toFixed(Number(minorUnit)));
}

function safeMessage(payload, fallback) {
  return String(payload?.error?.message || payload?.message || fallback).slice(0, 240);
}

async function callShadex(path, method, key, body) {
  const response = await fetch(`${SHADEX_API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${SHADEX_API_KEY.value()}`,
      Accept: "application/json",
      ...(method === "POST" ? {
        "Content-Type": "application/json",
        "Idempotency-Key": key,
      } : {}),
    },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function refundOnce({ requestRef, orderRef, walletRef, ledgerRef, requestData, message }) {
  await db.runTransaction(async (tx) => {
    const [requestSnap, walletSnap] = await Promise.all([
      tx.get(requestRef),
      tx.get(walletRef),
    ]);
    if (!requestSnap.exists || requestSnap.data().status === "refunded") return;
    const latest = requestSnap.data();
    if (latest.status !== "processing" || !walletSnap.exists) return;

    const currentBalance = Number(walletSnap.data().balance || 0);
    const restored = amountMajor(latest.amount_minor, latest.minor_unit);
    tx.update(walletRef, {
      balance: Number((currentBalance + restored).toFixed(latest.minor_unit)),
      updated_at: FieldValue.serverTimestamp(),
    });
    tx.create(ledgerRef, {
      user_id: latest.user_id,
      transaction_type: "refund",
      amount: restored,
      currency: latest.currency,
      status: "completed",
      source_id: latest.order_id,
      description: "Refund: ShadexGoLtd could not accept this purchase",
      created_at: FieldValue.serverTimestamp(),
    });
    tx.update(requestRef, {
      status: "refunded",
      message,
      updated_at: FieldValue.serverTimestamp(),
    });
    tx.update(orderRef, {
      status: "failed",
      payment_status: "refunded",
      fulfillment_status: "failed",
      admin_note: message,
      updated_at: FieldValue.serverTimestamp(),
    });
  });
}

exports.purchaseDigitalService = onCall(
  { region: "us-central1", secrets: [SHADEX_API_KEY], timeoutSeconds: 120 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to purchase a service.");

    const data = request.data || {};
    const planId = String(data.plan_id || "").trim();
    const idempotencyKey = String(data.idempotency_key || "").trim();
    const recipientType = String(data.recipient_type || "self").toLowerCase();
    const recipientName = String(data.recipient_name || "").trim().slice(0, 120);
    const recipientPhone = String(data.recipient_phone || "").trim().slice(0, 40);
    const recipientEmail = String(data.recipient_email || "").trim().toLowerCase().slice(0, 320);
    const accountName = String(data.account_name || "").trim().slice(0, 120);
    const accountEmail = String(data.account_email || "").trim().toLowerCase().slice(0, 320);

    if (!UUID.test(planId) || !UUID.test(idempotencyKey)) {
      throw new HttpsError("invalid-argument", "The selected plan or payment reference is invalid.");
    }
    if (!["self", "friend"].includes(recipientType)) {
      throw new HttpsError("invalid-argument", "Choose yourself or a friend.");
    }
    if (recipientType === "friend" && (!recipientName || (!recipientPhone && !recipientEmail))) {
      throw new HttpsError("invalid-argument", "Enter your friend's name and phone or email.");
    }
    if (accountEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail)) {
      throw new HttpsError("invalid-argument", "Enter a valid account email.");
    }

    const walletRef = db.collection("wallets").doc(uid);
    const serviceRef = db.collection("services").doc("marketplace");
    const requestRef = db.collection("digital_purchase_requests").doc(`${uid}_${idempotencyKey}`);
    const ledgerRef = db.collection("wallet_transactions").doc(`purchase_${uid}_${idempotencyKey}`);
    const orderRef = db.collection("orders").doc(`digital_${uid}_${idempotencyKey}`);
    let purchase = null;

    await db.runTransaction(async (tx) => {
      const [requestSnap, walletSnap, serviceSnap] = await Promise.all([
        tx.get(requestRef), tx.get(walletRef), tx.get(serviceRef),
      ]);

      if (requestSnap.exists) {
        purchase = requestSnap.data();
        if (purchase.plan_id !== planId || purchase.user_id !== uid
          || purchase.recipient_type !== recipientType
          || (purchase.recipient_name || "") !== (recipientType === "friend" ? recipientName : "")
          || (purchase.recipient_phone || "") !== (recipientType === "friend" ? recipientPhone : "")
          || (purchase.recipient_email || "") !== (recipientType === "friend" ? recipientEmail : "")
          || (purchase.account_name || "") !== accountName
          || (purchase.account_email || "") !== accountEmail) {
          throw new HttpsError("already-exists", "This payment reference was already used.");
        }
        if (["completed", "processing"].includes(purchase.status)) return;
        throw new HttpsError("failed-precondition", purchase.message || "This purchase did not complete. Start a new checkout.");
      }

      if (!serviceSnap.exists || serviceSnap.data().status !== "active") {
        throw new HttpsError("failed-precondition", "This service is temporarily unavailable.");
      }
      const price = serviceSnap.data().bukzex_prices?.[planId];
      if (!price || price.is_active === false || !Number.isSafeInteger(Number(price.amount_minor)) || Number(price.amount_minor) <= 0) {
        throw new HttpsError("failed-precondition", "This plan does not have an active BukzEx price.");
      }
      if (String(price.currency || "NGN") !== "NGN" || Number(price.minor_unit ?? 2) !== 2) {
        throw new HttpsError("failed-precondition", "This plan is not priced in NGN.");
      }
      if (!walletSnap.exists || String(walletSnap.data().currency || "NGN") !== "NGN") {
        throw new HttpsError("failed-precondition", "Your NGN wallet could not be found.");
      }

      const amountMinor = Number(price.amount_minor);
      const unit = Number(price.minor_unit ?? 2);
      const charge = amountMajor(amountMinor, unit);
      const balance = Number(walletSnap.data().balance || 0);
      if (!Number.isFinite(balance) || Math.round(balance * 100) < amountMinor) {
        throw new HttpsError("failed-precondition", "Your wallet balance is too low for this purchase.");
      }

      const order = {
        user_id: uid,
        service_key: "marketplace",
        service_name: String(price.item_name || "ShadexGoLtd digital service"),
        requested_amount: charge,
        currency: "NGN",
        status: "processing",
        payment_status: "paid",
        fulfillment_status: "processing",
        provider: "ShadexGoLtd",
        plan_id: planId,
        service_email: null,
        supplier_order_id: null,
        recipient_type: recipientType,
        recipient_name: recipientType === "friend" ? recipientName : null,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      };

      tx.update(walletRef, {
        balance: Number((balance - charge).toFixed(unit)),
        updated_at: FieldValue.serverTimestamp(),
      });
      tx.create(ledgerRef, {
        user_id: uid,
        transaction_type: "purchase",
        amount: charge,
        currency: "NGN",
        status: "completed",
        source_id: orderRef.id,
        description: `Digital service purchase: ${order.service_name}`,
        created_at: FieldValue.serverTimestamp(),
      });
      tx.create(orderRef, order);
      tx.create(requestRef, {
        user_id: uid,
        plan_id: planId,
        idempotency_key: idempotencyKey,
        recipient_type: recipientType,
        recipient_name: recipientType === "friend" ? recipientName : "",
        recipient_phone: recipientType === "friend" ? recipientPhone : "",
        recipient_email: recipientType === "friend" ? recipientEmail : "",
        account_name: accountName,
        account_email: accountEmail,
        order_id: orderRef.id,
        amount_minor: amountMinor,
        minor_unit: unit,
        currency: "NGN",
        status: "processing",
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
      purchase = { ...order, id: orderRef.id, amount_minor: amountMinor, minor_unit: unit };
    });

    // A retry with the same key repeats only the idempotent supplier request;
    // the wallet debit above is never repeated.
    purchase = purchase || (await requestRef.get()).data();
    if (!purchase) throw new HttpsError("internal", "Purchase status could not be recovered.");
    if (purchase.status === "completed") return purchase;

    const { response, payload } = await callShadex("/api/purchase/digital", "POST", idempotencyKey, {
      plan_id: planId,
      recipient_type: recipientType,
      recipient_name: recipientType === "friend" ? recipientName : null,
      recipient_email: recipientType === "friend" ? recipientEmail || null : null,
      recipient_phone: recipientType === "friend" ? recipientPhone || null : null,
      account_name: accountName || null,
      account_email: accountEmail || null,
    }).catch(async () => {
      await orderRef.update({ admin_note: "Supplier response is pending. Retry this order to check its status.", updated_at: FieldValue.serverTimestamp() });
      throw new HttpsError("unavailable", "Payment is reserved while ShadexGoLtd confirms the order. Refresh Orders in a moment.");
    });

    if (!response.ok || payload?.success !== true) {
      // Refund only explicit supplier rejections known to happen before an order is charged.
      if ([400, 401, 403, 402, 409, 422].includes(response.status)) {
        const message = safeMessage(payload, "ShadexGoLtd could not accept this plan.");
        await refundOnce({ requestRef, orderRef, walletRef, ledgerRef: db.collection("wallet_transactions").doc(`refund_${uid}_${idempotencyKey}`), message });
        throw new HttpsError("failed-precondition", `${message} Your BukzEx wallet has been refunded.`);
      }
      throw new HttpsError("unavailable", "ShadexGoLtd is still confirming the order. Your payment is reserved; refresh Orders shortly.");
    }

    const upstream = payload.data?.order || {};
    const isActive = Boolean(upstream.login_email) && String(upstream.status).toLowerCase() === "active";
    const safeUpdate = {
      supplier_order_id: String(upstream.id || ""),
      service_email: upstream.login_email ? String(upstream.login_email) : null,
      status: isActive ? "active" : "processing",
      fulfillment_status: isActive ? "fulfilled" : "processing",
      stack_id: upstream.stack_id || null,
      service_starts_at: upstream.starts_at || null,
      service_ends_at: upstream.ends_at || null,
      support_url: SUPPORT_URL,
      updated_at: FieldValue.serverTimestamp(),
    };
    await db.runTransaction(async (tx) => {
      tx.update(orderRef, safeUpdate);
      tx.update(requestRef, {
        status: "completed",
        supplier_order_id: safeUpdate.supplier_order_id || null,
        message: payload.data?.message || "Purchase completed.",
        updated_at: FieldValue.serverTimestamp(),
      });
    });

    return { order_id: orderRef.id, ...safeUpdate, message: payload.data?.message || "Purchase completed." };
  },
);

exports.refreshDigitalServiceOrder = onCall(
  { region: "us-central1", secrets: [SHADEX_API_KEY], timeoutSeconds: 60 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to refresh your order.");
    const orderId = String(request.data?.order_id || "");
    if (!orderId.startsWith(`digital_${uid}_`)) throw new HttpsError("permission-denied", "This order is not yours.");

    const orderRef = db.collection("orders").doc(orderId);
    const snapshot = await orderRef.get();
    if (!snapshot.exists || snapshot.data().user_id !== uid || !snapshot.data().supplier_order_id) {
      throw new HttpsError("not-found", "The supplier order is not ready to refresh yet.");
    }
    const order = snapshot.data();
    const { response, payload } = await callShadex(`/api/orders/${order.supplier_order_id}`, "GET", "", null);
    const upstream = payload?.data?.order;
    if (!response.ok || !upstream) throw new HttpsError("unavailable", "ShadexGoLtd order status is temporarily unavailable.");

    const active = Boolean(upstream.login_email) && String(upstream.status).toLowerCase() === "active";
    const update = {
      service_email: upstream.login_email || null,
      status: active ? "active" : "processing",
      fulfillment_status: active ? "fulfilled" : "processing",
      stack_id: upstream.stack_id || null,
      service_starts_at: upstream.starts_at || null,
      service_ends_at: upstream.ends_at || null,
      updated_at: FieldValue.serverTimestamp(),
    };
    await orderRef.update(update);
    return { order_id: orderId, ...update };
  },
);

// Wallet checkout for every ShadexGoLtd catalogue supported by the public API.
// The saved BukzEx price is read from Firestore; the client never chooses the charge.
exports.purchaseShadexService = onCall(
  { region: "us-central1", secrets: [SHADEX_API_KEY], timeoutSeconds: 120 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to purchase a service.");

    const data = request.data || {};
    const serviceKey = String(data.service_key || "").trim();
    const itemId = String(data.item_id || "").trim();
    const idempotencyKey = String(data.idempotency_key || "").trim();
    const recipientType = String(data.recipient_type || "self").toLowerCase();
    const inputs = data.inputs && typeof data.inputs === "object" ? data.inputs : {};
    if (!UUID.test(idempotencyKey) || !itemId) {
      throw new HttpsError("invalid-argument", "The selected service or payment reference is invalid.");
    }
    if (!["vtu", "bills", "sms", "social", "marketplace"].includes(serviceKey)) {
      throw new HttpsError("invalid-argument", "This ShadexGoLtd service is not supported yet.");
    }
    if (!["self", "friend"].includes(recipientType)) {
      throw new HttpsError("invalid-argument", "Choose yourself or a friend.");
    }

    const phone = String(inputs.phone_number || "").trim().slice(0, 40);
    const targetLink = String(inputs.target_link || "").trim().slice(0, 500);
    const customerIdentifier = String(inputs.customer_identifier || "").trim().slice(0, 120);
    const requestedAmount = Number(inputs.amount || 0);
    if (serviceKey === "vtu" && (!phone || !["airtime", "data"].includes(String(inputs.service_type)))) {
      throw new HttpsError("invalid-argument", "Enter the recipient phone number and choose airtime or data.");
    }
    if (serviceKey === "bills" && (!customerIdentifier || !phone)) {
      throw new HttpsError("invalid-argument", "Enter the meter or smartcard number and phone number.");
    }
    if (serviceKey === "social" && !targetLink) {
      throw new HttpsError("invalid-argument", "Enter the link for the social service.");
    }

    const walletRef = db.collection("wallets").doc(uid);
    const serviceRef = db.collection("services").doc(serviceKey);
    const priceRef = serviceRef.collection("prices").doc(encodeURIComponent(itemId));
    const feeItemId = `fee-${String(inputs.provider_id || "")}`;
    const feePriceRef = serviceRef.collection("prices").doc(encodeURIComponent(feeItemId));
    const orderRef = db.collection("orders").doc(`shadex_${uid}_${idempotencyKey}`);
    const requestRef = db.collection("shadex_purchase_requests").doc(`${uid}_${idempotencyKey}`);
    const purchaseLedgerRef = db.collection("wallet_transactions").doc(`purchase_${uid}_${idempotencyKey}`);
    let purchase = null;
    let amountMinor = 0;
    let minorUnit = 2;
    let currency = "NGN";
    let serviceName = "ShadexGoLtd service";

    await db.runTransaction(async (tx) => {
      const [requestSnap, walletSnap, serviceSnap, priceSnap, feePriceSnap] = await Promise.all([
        tx.get(requestRef), tx.get(walletRef), tx.get(serviceRef), tx.get(priceRef),
        serviceKey === "bills" && inputs.variable_amount === true
          ? tx.get(feePriceRef)
          : Promise.resolve(null),
      ]);
      if (requestSnap.exists) {
        const prior = requestSnap.data();
        if (prior.user_id !== uid || prior.service_key !== serviceKey || prior.item_id !== itemId) {
          throw new HttpsError("already-exists", "This payment reference was already used.");
        }
        if (prior.status === "refunded") {
          throw new HttpsError("failed-precondition", "This payment was refunded. Start a new checkout.");
        }
        purchase = prior;
        amountMinor = Number(prior.amount_minor);
        minorUnit = Number(prior.minor_unit);
        currency = String(prior.currency || "NGN");
        serviceName = String(prior.service_name || serviceName);
        return;
      }
      if (!serviceSnap.exists || serviceSnap.data().status !== "active") {
        throw new HttpsError("failed-precondition", "This service is not enabled by BukzEx yet.");
      }
      if (!walletSnap.exists || String(walletSnap.data().currency || "NGN") !== "NGN") {
        throw new HttpsError("failed-precondition", "Your BukzEx NGN wallet could not be found.");
      }
      const config = serviceSnap.data();
      const savedPrice = priceSnap.exists ? priceSnap.data() : config.bukzex_prices?.[itemId];
      const markup = Number(config.price_markup_percent || 0);
      let chargeMajor;
      if (serviceKey === "vtu" && String(inputs.service_type) === "airtime") {
        if (!Number.isFinite(requestedAmount) || requestedAmount < 50 || requestedAmount > 1000000) {
          throw new HttpsError("invalid-argument", "Enter a valid airtime amount.");
        }
        chargeMajor = requestedAmount * (1 + markup / 100);
        serviceName = `Airtime · ${String(inputs.network_name || "Network")}`;
      } else if (serviceKey === "bills" && inputs.variable_amount === true) {
        if (!Number.isFinite(requestedAmount) || requestedAmount < 100 || requestedAmount > 10000000) {
          throw new HttpsError("invalid-argument", "Enter a valid bill amount.");
        }
        const fee = feePriceSnap?.exists
          ? feePriceSnap.data()
          : config.bukzex_prices?.[feeItemId];
        const feeMajor = fee && fee.is_active !== false ? Number(fee.amount_minor) / (10 ** Number(fee.minor_unit ?? 2)) : 0;
        chargeMajor = requestedAmount * (1 + markup / 100) + feeMajor;
        serviceName = String(inputs.item_name || "Bill payment");
      } else {
        if (!savedPrice || savedPrice.is_active === false || !Number.isSafeInteger(Number(savedPrice.amount_minor)) || Number(savedPrice.amount_minor) <= 0) {
          throw new HttpsError("failed-precondition", "This item has no active BukzEx price. Ask the administrator to set one.");
        }
        amountMinor = Number(savedPrice.amount_minor);
        minorUnit = Number(savedPrice.minor_unit ?? 2);
        currency = String(savedPrice.currency || "NGN");
        chargeMajor = amountMinor / (10 ** minorUnit);
        serviceName = String(savedPrice.item_name || inputs.item_name || "ShadexGoLtd service");
      }
      if (currency !== "NGN" || minorUnit !== 2) {
        throw new HttpsError("failed-precondition", "This service price is not in NGN.");
      }
      amountMinor = Math.round(chargeMajor * 100);
      const charge = amountMinor / 100;
      const balance = Number(walletSnap.data().balance || 0);
      if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 || Math.round(balance * 100) < amountMinor) {
        throw new HttpsError("failed-precondition", "Your wallet balance is too low for this purchase.");
      }
      const order = {
        user_id: uid, service_key: serviceKey,
        service_name: serviceName, requested_amount: charge, amount_minor: amountMinor,
        currency, minor_unit: minorUnit, provider: "ShadexGoLtd",
        status: "processing", payment_status: "paid", fulfillment_status: "processing",
        recipient_type: recipientType,
        recipient_name: String(data.recipient_name || "").slice(0, 120) || null,
        supplier_order_id: null, service_email: null, support_url: SUPPORT_URL,
        created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
      };
      tx.update(walletRef, { balance: Number((balance - charge).toFixed(2)), updated_at: FieldValue.serverTimestamp() });
      tx.create(purchaseLedgerRef, {
        user_id: uid, transaction_type: "purchase", amount: charge,
        currency, status: "completed", source_id: orderRef.id,
        description: `ShadexGoLtd purchase: ${serviceName}`, created_at: FieldValue.serverTimestamp(),
      });
      tx.create(orderRef, order);
      const saved = {
        user_id: uid, service_key: serviceKey, item_id: itemId, service_name: serviceName,
        order_id: orderRef.id, idempotency_key: idempotencyKey,
        amount_minor: amountMinor, minor_unit: minorUnit, currency,
        request_data: inputs, recipient_type: recipientType,
        recipient_name: order.recipient_name, status: "processing",
        created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
      };
      tx.create(requestRef, saved);
      purchase = saved;
    });

    const routes = {
      vtu: ["/vtu/orders", {
        service_type: inputs.service_type, network_id: inputs.network_id,
        ...(inputs.service_type === "data" ? { data_plan_id: itemId } : { amount: requestedAmount }),
        phone_number: phone,
      }],
      bills: ["/bills/orders", {
        plan_id: itemId, customer_identifier: customerIdentifier, phone_number: phone,
        ...(inputs.variable_amount === true ? { amount: requestedAmount } : {}),
      }],
      sms: ["/otp/orders", { service_id: itemId }],
      social: ["/social-boost/orders", { package_id: itemId, target_link: targetLink }],
      marketplace: ["/digital-services/orders", {
        plan_id: itemId, recipient_type: recipientType,
        recipient_name: recipientType === "friend" ? String(data.recipient_name || "").trim() : null,
        recipient_phone: recipientType === "friend" ? String(data.recipient_phone || "").trim() : null,
      }],
    };
    const [path, body] = routes[serviceKey];
    let upstream;
    try {
      const result = await callShadex(path, "POST", idempotencyKey, body);
      if (!result.response.ok || result.payload?.success !== true) {
        if ([400, 401, 402, 403, 409, 422].includes(result.response.status)) {
          const message = safeMessage(result.payload, "ShadexGoLtd could not accept this service order.");
          await refundOnce({
            requestRef, orderRef, walletRef,
            ledgerRef: db.collection("wallet_transactions").doc(`refund_${uid}_${idempotencyKey}`),
            message,
          });
          throw new HttpsError("failed-precondition", `${message} Your BukzEx wallet has been refunded.`);
        }
        throw new HttpsError("unavailable", "ShadexGoLtd is confirming the order. Your payment is reserved; check Payment · Order · Stack shortly.");
      }
      upstream = result.payload.data?.order || result.payload.data || {};
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      throw new HttpsError("unavailable", "ShadexGoLtd is confirming the order. Your payment is reserved; check Payment · Order · Stack shortly.");
    }

    const supplierOrderId = String(upstream.id || upstream.order_id || "");
    const serviceEmail = upstream.login_email || upstream.service_email || null;
    const statusText = String(upstream.status || "processing").toLowerCase();
    const completed = ["active", "completed", "success", "successful"].includes(statusText);
    const update = {
      supplier_order_id: supplierOrderId || null,
      service_email: serviceEmail ? String(serviceEmail).slice(0, 320) : null,
      status: completed ? "completed" : "processing",
      fulfillment_status: completed ? "fulfilled" : "processing",
      supplier_status: statusText,
      support_url: SUPPORT_URL,
      updated_at: FieldValue.serverTimestamp(),
    };
    await db.runTransaction(async (tx) => {
      tx.update(orderRef, update);
      tx.update(requestRef, { status: "completed", supplier_order_id: supplierOrderId || null, updated_at: FieldValue.serverTimestamp() });
    });
    return {
      order_id: orderRef.id, ...update,
      message: serviceEmail
        ? "Payment completed. Your ShadexGoLtd service email is in Payment · Order · Stack. Contact Customer Care for password or OTP assistance."
        : "Payment completed. Your ShadexGoLtd order is in Payment · Order · Stack. Contact Customer Care for delivery or OTP assistance.",
    };
  },
);
