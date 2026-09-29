import { requireSupabase } from "../lib/supabase";

function fail(error) {
  if (error) throw new Error(error.message || "BukzEx could not complete that request.");
}

function mapOrder(row) {
  return {
    ...row,
    service: row.service_key,
    serviceName: row.services?.name || row.service_key,
    amount: Number(row.requested_amount || 0),
    createdAt: row.created_at,
    customerName: [row.profiles?.first_name, row.profiles?.last_name]
      .filter(Boolean)
      .join(" "),
  };
}

function mapDeposit(row) {
  return {
    ...row,
    reference: row.payment_reference,
    createdAt: row.created_at,
    customerName: [row.profiles?.first_name, row.profiles?.last_name]
      .filter(Boolean)
      .join(" "),
  };
}

export async function getWalletBalance() {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  fail(userError);
  if (!user) throw new Error("Sign in to view your wallet.");

  const { data, error } = await client
    .from("wallets")
    .select("balance, currency")
    .eq("user_id", user.id)
    .single();

  fail(error);
  return { balance: Number(data.balance), currency: data.currency };
}

export async function createDeposit(reference, amount) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("create_wallet_deposit", {
    p_amount: Number(amount),
    p_payment_reference: reference.trim(),
  });
  fail(error);
  const row = Array.isArray(data) ? data[0] : data;
  return { ...row, depositId: row.id, message: "Deposit request sent for administrator review." };
}

export async function getDepositStatus(depositId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("wallet_deposits")
    .select("id, amount, currency, payment_reference, status, created_at")
    .eq("id", depositId)
    .single();
  fail(error);
  return mapDeposit(data);
}

export async function confirmDeposit(depositId) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_confirm_wallet_deposit", {
    p_deposit_id: depositId,
  });
  fail(error);
  return Array.isArray(data) ? data[0] : data;
}

export async function getServices() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("services")
    .select("id, service_key, name, description, status, provider, created_at")
    .order("name");
  fail(error);
  return { services: data || [] };
}

export async function purchaseService({ service, amount, details }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("create_service_order", {
    p_service_key: service,
    p_amount: Number(amount),
    p_details: details,
  });
  fail(error);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    ...mapOrder(row),
    message: "Your service request has been sent for review. No wallet money has been taken.",
  };
}

export async function getOrders() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("orders")
    .select("id,user_id,service_key,requested_amount,currency,details,status,admin_note,created_at,profiles(first_name,last_name),services(name)")
    .order("created_at", { ascending: false });
  fail(error);
  return { orders: (data || []).map(mapOrder) };
}

export async function updateOrder(orderId, status, adminNote = "") {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_update_order", {
    p_order_id: orderId,
    p_status: status,
    p_admin_note: adminNote,
  });
  fail(error);
  return Array.isArray(data) ? data[0] : data;
}

export async function getDeposits() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("wallet_deposits")
    .select("id,user_id,amount,currency,payment_reference,status,reviewed_at,created_at,profiles(first_name,last_name)")
    .order("created_at", { ascending: false });
  fail(error);
  return { deposits: (data || []).map(mapDeposit) };
}

export async function getWalletTransactions() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("wallet_transactions")
    .select("id,user_id,transaction_type,amount,currency,status,description,created_at")
    .order("created_at", { ascending: false });
  fail(error);
  return { transactions: data || [] };
}
