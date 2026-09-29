import {
  getDemoWallet,
  setDemoWallet,
  getDemoOrders,
  getDemoDeposits,
  addDemoOrder,
  addDemoDeposit,
  confirmDemoDeposit as confirmDemoDepositFromStore,
} from "./demoStore";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

const DEMO_MODE = !API_BASE_URL;

async function request(endpoint, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status}`
    );
  }

  return response.json();
}

export async function getWalletBalance() {
  if (DEMO_MODE) {
    return getDemoWallet();
  }

  return request("/wallet/balance");
}

export async function createDeposit(reference, amount) {
  if (DEMO_MODE) {
    const deposit = addDemoDeposit({
      reference,
      amount: Number(amount) || 0,
    });

    return {
      ...deposit,
      message:
        "Demo deposit submitted. In the live system, the backend will verify the transfer and credit the wallet.",
    };
  }

  return request("/wallet/deposits", {
    method: "POST",
    body: JSON.stringify({ reference }),
  });
}

export async function getDepositStatus(depositId) {
  if (DEMO_MODE) {
    const deposits = getDemoDeposits();

    const deposit = deposits.find(
      (item) => item.id === depositId
    );

    return (
      deposit || {
        id: depositId,
        status: "pending",
      }
    );
  }

  return request(`/wallet/deposits/${depositId}`);
}

export async function confirmDemoDeposit(depositId) {
  if (!DEMO_MODE) {
    throw new Error(
      "Demo deposit confirmation is only available in demo mode."
    );
  }

  return confirmDemoDepositFromStore(depositId);
}

export async function getServices() {
  if (DEMO_MODE) {
    return {
      services: [
        {
          id: "vtu",
          name: "VTU",
          status: "available",
        },
        {
          id: "marketplace",
          name: "Marketplace",
          status: "available",
        },
        {
          id: "sms",
          name: "Virtual SMS / OTP",
          status: "available",
        },
        {
          id: "social",
          name: "Social Media Boost",
          status: "available",
        },
        {
          id: "gift-cards",
          name: "Gift Cards",
          status: "available",
        },
        {
          id: "crypto",
          name: "Crypto",
          status: "available",
        },
      ],
    };
  }

  return request("/services");
}

export async function purchaseService(data) {
  if (DEMO_MODE) {
    const wallet = getDemoWallet();
    const amount = Number(data.amount);

    if (!amount || amount <= 0) {
      throw new Error("Enter a valid amount.");
    }

    if (amount > wallet.balance) {
      throw new Error("Insufficient wallet balance.");
    }

    const updatedBalance = wallet.balance - amount;

    setDemoWallet(updatedBalance);

    const order = addDemoOrder({
      service: data.service,
      serviceName: data.serviceName || data.service,
      amount,
      details: data.details,
    });

    return {
      ...order,
      balance: updatedBalance,
      message:
        "Demo order submitted successfully.",
    };
  }

  return request("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getOrders() {
  if (DEMO_MODE) {
    return {
      orders: getDemoOrders(),
    };
  }

  return request("/orders");
}


export async function getDeposits() {
  if (DEMO_MODE) {
    return {
      deposits: getDemoDeposits(),
    };
  }

  return request("/admin/deposits");
}
