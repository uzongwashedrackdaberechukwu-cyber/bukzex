const WALLET_KEY = "bukzex_demo_wallet";
const ORDERS_KEY = "bukzex_demo_orders";
const DEPOSITS_KEY = "bukzex_demo_deposits";

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getDemoWallet() {
  return read(WALLET_KEY, {
    balance: 0,
  });
}

export function setDemoWallet(balance) {
  const wallet = {
    balance: Number(balance) || 0,
  };

  write(WALLET_KEY, wallet);

  return wallet;
}

export function getDemoOrders() {
  return read(ORDERS_KEY, []);
}

export function addDemoOrder(order) {
  const orders = getDemoOrders();

  const newOrder = {
    id: `BZ-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    ...order,
  };

  orders.unshift(newOrder);
  write(ORDERS_KEY, orders);

  return newOrder;
}

export function getDemoDeposits() {
  return read(DEPOSITS_KEY, []);
}

export function addDemoDeposit(deposit) {
  const deposits = getDemoDeposits();

  const newDeposit = {
    id: `DEP-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    ...deposit,
  };

  deposits.unshift(newDeposit);
  write(DEPOSITS_KEY, deposits);

  return newDeposit;
}


export function confirmDemoDeposit(depositId) {
  const deposits = getDemoDeposits();

  const index = deposits.findIndex(
    (deposit) => deposit.id === depositId
  );

  if (index === -1) {
    throw new Error("Deposit not found.");
  }

  const deposit = deposits[index];

  if (deposit.status === "confirmed") {
    return deposit;
  }

  deposit.status = "confirmed";
  deposit.confirmedAt = new Date().toISOString();

  deposits[index] = deposit;
  write(DEPOSITS_KEY, deposits);

  const wallet = getDemoWallet();
  const updatedBalance =
    Number(wallet.balance || 0) +
    Number(deposit.amount || 0);

  setDemoWallet(updatedBalance);

  return {
    ...deposit,
    balance: updatedBalance,
  };
}
