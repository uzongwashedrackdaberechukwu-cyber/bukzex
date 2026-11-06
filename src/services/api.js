import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { WORKER_URL } from "./shadexCatalog";

function requireUser() {
  if (!auth.currentUser) throw new Error("Sign in to continue.");
  return auth.currentUser;
}

async function requireAdmin() {
  const user = requireUser();
  const adminSnap = await getDoc(doc(db, "admins", user.uid));
  if (!adminSnap.exists()) throw new Error("Administrator access required.");
  return user;
}

function dateValue(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return value;
}

function sortNewest(rows) {
  return rows.sort((a, b) =>
    String(dateValue(b.created_at) || "").localeCompare(
      String(dateValue(a.created_at) || "")
    )
  );
}

function mapOrder(row) {
  return {
    ...row,
    service: row.service_key,
    serviceName: row.service_name || row.service_key,
    amount: Number(row.requested_amount || 0),
    createdAt: dateValue(row.created_at),
    customerName: row.customer_name || "",
  };
}

function mapDeposit(row) {
  return {
    ...row,
    reference: row.payment_reference,
    createdAt: dateValue(row.created_at),
    customerName: row.customer_name || "",
  };
}

async function currentName(uid) {
  const profile = await getDoc(doc(db, "profiles", uid));
  if (!profile.exists()) return "";
  const data = profile.data();
  return [data.first_name, data.last_name].filter(Boolean).join(" ");
}

export async function getWalletBalance() {
  const user = requireUser();
  const walletSnap = await getDoc(doc(db, "wallets", user.uid));
  if (!walletSnap.exists()) return { balance: 0, currency: "NGN" };

  const wallet = walletSnap.data();
  return {
    balance: Number(wallet.balance || 0),
    currency: wallet.currency || "NGN",
  };
}

export async function purchaseDigitalService(payload) {
  return callBukzExWorker("/api/checkout/purchase", payload);
}

export async function purchaseShadexService(payload) {
  return callBukzExWorker("/api/checkout/purchase", payload);
}

export async function cancelAdminOrder(orderId, reason = "Cancelled by administrator") {
  return callBukzExWorker("/api/admin/orders/cancel", {
    order_id: String(orderId || ""),
    reason,
  });
}

export async function creditCustomerWallet(userId, amountMinor, reason, idempotencyKey) {
  return callBukzExWorker("/api/admin/wallet-credit", {
    user_id: String(userId || ""),
    amount_minor: Number(amountMinor),
    reason: String(reason || ""),
    idempotency_key: String(idempotencyKey || ""),
  });
}

export async function debitCustomerWallet(userId, amountMinor, reason, idempotencyKey) {
  return callBukzExWorker("/api/admin/wallet-debit", {
    user_id: String(userId || ""),
    amount_minor: Number(amountMinor),
    reason: String(reason || ""),
    idempotency_key: String(idempotencyKey || ""),
  });
}

export async function refreshDigitalServiceOrder(orderId) {
  return callBukzExWorker("/api/checkout/order-refresh", { order_id: orderId });
}

async function callBukzExWorkerGet(path) {
  const user = requireUser();
  const token = await user.getIdToken();
  const response = await fetch(`${WORKER_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.success !== true) {
    throw new Error(result?.error?.message || "BukzEx could not load crypto information.");
  }
  return result.data;
}

export async function getCryptoRoutes() {
  const data = await callBukzExWorkerGet("/api/crypto/routes");
  return Array.isArray(data?.routes) ? data.routes : [];
}

export async function getCryptoAdminRoutes() {
  const data = await callBukzExWorkerGet("/api/crypto/admin-routes");
  return Array.isArray(data?.routes) ? data.routes : [];
}

export async function getCryptoActivity() {
  const data = await callBukzExWorkerGet("/api/crypto/activity");
  return Array.isArray(data?.requests) ? data.requests : [];
}

export async function submitCryptoDeposit(payload) {
  return callBukzExWorker("/api/crypto/deposits", {
    ...payload,
    idempotency_key: payload.idempotency_key || globalThis.crypto.randomUUID(),
  });
}

export async function submitCryptoWithdrawal(payload) {
  return callBukzExWorker("/api/crypto/withdrawals", {
    ...payload,
    idempotency_key: payload.idempotency_key || globalThis.crypto.randomUUID(),
  });
}

async function callBukzExWorker(path, payload) {
  const user = requireUser();
  const token = await user.getIdToken();
  const response = await fetch(`${WORKER_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(payload?.idempotency_key ? { "Idempotency-Key": payload.idempotency_key } : {}),
    },
    body: JSON.stringify(payload || {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.error?.message || "BukzEx could not complete this request. Please try again.");
    error.status = response.status;
    throw error;
  }
  return result.data;
}

export async function createDeposit(reference, amount) {
  const user = requireUser();
  const value = Number(amount);
  const paymentReference = String(reference || "").trim();

  if (!Number.isFinite(value) || value <= 0 || value > 10000000) {
    throw new Error("Enter a valid deposit amount.");
  }
  if (!paymentReference) throw new Error("Enter the transfer reference.");

  const duplicate = await getDocs(
    query(
      collection(db, "wallet_deposits"),
      where("user_id", "==", user.uid),
      where("payment_reference", "==", paymentReference)
    )
  );
  if (!duplicate.empty) {
    throw new Error("You already submitted this transfer reference.");
  }

  const profileSnap = await getDoc(doc(db, "profiles", user.uid));
  const profile = profileSnap.exists() ? profileSnap.data() : {};
  const customerName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ");
  const deposit = {
    user_id: user.uid,
    amount: Math.round(value * 100) / 100,
    currency: "NGN",
    payment_reference: paymentReference,
    status: "pending",
    customer_name: customerName,
    created_at: serverTimestamp(),
  };
  const created = await addDoc(collection(db, "wallet_deposits"), deposit);

  return {
    ...deposit,
    id: created.id,
    depositId: created.id,
    message: "Deposit request sent for administrator review.",
  };
}

export async function getDepositStatus(depositId) {
  const depositSnap = await getDoc(doc(db, "wallet_deposits", depositId));
  if (!depositSnap.exists()) throw new Error("Deposit not found.");
  return mapDeposit({ id: depositSnap.id, ...depositSnap.data() });
}

export async function confirmDeposit(depositId) {
  await requireAdmin();
  return callBukzExWorker("/api/admin/deposits/confirm", {
    deposit_id: String(depositId || ""),
  });
}


export async function submitCustomerReview(orderId, rating, feedback, publishConsent = false) {
  return callBukzExWorker("/api/reviews", {
    order_id: String(orderId || ""),
    rating: Number(rating),
    feedback: String(feedback || ""),
    publish_consent: publishConsent === true,
  });
}

export async function getBukzExAdminReviews() {
  const data = await callBukzExWorkerGet("/api/admin/reviews");
  return Array.isArray(data?.reviews) ? data.reviews : [];
}

export async function moderateBukzExReview(reviewId, status) {
  return callBukzExWorker("/api/admin/reviews/moderate", {
    review_id: String(reviewId || ""),
    status: String(status || ""),
  });
}

export async function getBukzExPublicReviews() {
  const response = await fetch(WORKER_URL + "/api/reviews", {
    headers: { Accept: "application/json" },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.success !== true) {
    throw new Error(result?.error?.message || "BukzEx customer reviews could not be loaded.");
  }
  return Array.isArray(result?.data?.reviews) ? result.data.reviews : [];
}

export async function getServices() {
  const user = auth.currentUser;
  let result;

  if (user) {
    const adminSnap = await getDoc(doc(db, "admins", user.uid));
    if (adminSnap.exists()) {
      result = await getDocs(query(collection(db, "services"), orderBy("name")));
    } else {
      result = await getDocs(
        query(collection(db, "services"), where("status", "==", "active"))
      );
    }
  } else {
    result = await getDocs(
      query(collection(db, "services"), where("status", "==", "active"))
    );
  }

  const services = result.docs.map((serviceDoc) => ({
    id: serviceDoc.id,
    ...serviceDoc.data(),
  }));
  services.sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""))
  );
  return { services };
}

export async function purchaseService({ service, amount, details }) {
  const user = requireUser();
  const value = Number(amount);
  const cleanDetails = String(details || "").trim();

  if (!Number.isFinite(value) || value <= 0 || value > 10000000) {
    throw new Error("Enter a valid amount.");
  }
  if (!cleanDetails) throw new Error("Enter the service details.");

  const serviceSnap = await getDoc(doc(db, "services", service));
  if (!serviceSnap.exists() || serviceSnap.data().status !== "active") {
    throw new Error("This service is not enabled yet.");
  }

  const profileSnap = await getDoc(doc(db, "profiles", user.uid));
  const profile = profileSnap.exists() ? profileSnap.data() : {};
  const customerName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ");
  const row = {
    user_id: user.uid,
    service_key: service,
    service_name: serviceSnap.data().name || service,
    requested_amount: Math.round(value * 100) / 100,
    currency: "NGN",
    details: cleanDetails,
    status: "pending",
    admin_note: null,
    customer_name: customerName,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  const created = await addDoc(collection(db, "orders"), row);

  return {
    ...mapOrder({ ...row, id: created.id }),
    message:
      "Your service request has been sent for review. No wallet money has been taken.",
  };
}

export async function getOrders() {
  const user = requireUser();
  const adminSnap = await getDoc(doc(db, "admins", user.uid));
  const ordersQuery = adminSnap.exists()
    ? query(collection(db, "orders"))
    : query(collection(db, "orders"), where("user_id", "==", user.uid));
  const result = await getDocs(ordersQuery);

  return {
    orders: sortNewest(
      result.docs.map((orderDoc) =>
        mapOrder({ id: orderDoc.id, ...orderDoc.data() })
      )
    ),
  };
}

export async function getCustomerOrders() {
  // The customer-facing Purchases page must always be scoped to the signed-in
  // customer, even when an administrator account opens that page.
  const user = requireUser();
  const result = await getDocs(
    query(collection(db, "orders"), where("user_id", "==", user.uid))
  );

  return {
    orders: sortNewest(
      result.docs.map((orderDoc) =>
        mapOrder({ id: orderDoc.id, ...orderDoc.data() })
      )
    ),
  };
}

export async function updateOrder(orderId, status, adminNote = "") {
  await requireAdmin();
  if (!["processing", "completed", "rejected"].includes(status)) {
    throw new Error("Invalid order status.");
  }

  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) throw new Error("Order not found.");

  const note = String(adminNote || "").trim();
  await updateDoc(orderRef, {
    status,
    admin_note: note || null,
    updated_at: serverTimestamp(),
  });

  return {
    id: orderId,
    ...orderSnap.data(),
    status,
    admin_note: note || null,
  };
}

function orderIsUnpaidAndRemovable(order) {
  const status = String(order?.status || "").toLowerCase();
  const paymentStatus = String(order?.payment_status || "").toLowerCase();
  const removableStatus = ["pending", "rejected", "failed"].includes(status);
  const unpaid = !paymentStatus || ["unpaid", "failed", "rejected"].includes(paymentStatus);
  return removableStatus && unpaid;
}

export async function deleteOrder(orderId) {
  await requireAdmin();
  const orderRef = doc(db, "orders", String(orderId || ""));
  const snapshot = await getDoc(orderRef);
  if (!snapshot.exists()) throw new Error("Order not found.");
  if (!orderIsUnpaidAndRemovable(snapshot.data())) {
    throw new Error("Only rejected or unpaid orders can be permanently deleted.");
  }
  await deleteDoc(orderRef);
  return { id: orderId, deleted: true };
}

export async function deleteMyUnpaidOrder(orderId) {
  const user = requireUser();
  const orderRef = doc(db, "orders", String(orderId || ""));
  const snapshot = await getDoc(orderRef);
  if (!snapshot.exists()) throw new Error("Order not found.");
  const order = snapshot.data();
  if (order.user_id !== user.uid) throw new Error("You can only delete your own order.");
  if (!orderIsUnpaidAndRemovable(order)) {
    throw new Error("Only unpaid orders can be deleted.");
  }
  await deleteDoc(orderRef);
  return { id: orderId, deleted: true };
}

export async function getDeposits() {
  const user = requireUser();
  const adminSnap = await getDoc(doc(db, "admins", user.uid));
  const depositsQuery = adminSnap.exists()
    ? query(collection(db, "wallet_deposits"))
    : query(
        collection(db, "wallet_deposits"),
        where("user_id", "==", user.uid)
      );
  const result = await getDocs(depositsQuery);

  return {
    deposits: sortNewest(
      result.docs.map((depositDoc) =>
        mapDeposit({ id: depositDoc.id, ...depositDoc.data() })
      )
    ),
  };
}

export async function getWalletTransactions() {
  const user = requireUser();
  const adminSnap = await getDoc(doc(db, "admins", user.uid));
  const transactionsQuery = adminSnap.exists()
    ? query(collection(db, "wallet_transactions"))
    : query(
        collection(db, "wallet_transactions"),
        where("user_id", "==", user.uid)
      );
  const result = await getDocs(transactionsQuery);

  return {
    transactions: sortNewest(
      result.docs.map((transactionDoc) => ({
        id: transactionDoc.id,
        ...transactionDoc.data(),
        created_at: dateValue(transactionDoc.data().created_at),
      }))
    ),
  };
}
