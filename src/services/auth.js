const SESSION_KEY = "bukzex_session";
const USERS_KEY = "bukzex_demo_users";

const DEMO_ADMIN = {
  id: "admin-demo",
  firstName: "BukzEx",
  lastName: "Admin",
  email: "admin@bukzex.com",
  phone: "",
  password: "admin123",
  role: "admin",
};

function getUsers() {
  try {
    const users = JSON.parse(
      localStorage.getItem(USERS_KEY) || "[]"
    );

    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(users)
  );
}

export function getSession() {
  try {
    return JSON.parse(
      localStorage.getItem(SESSION_KEY) || "null"
    );
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getSession());
}

export function getRegisteredUsers() {
  return getUsers().map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role || "customer",
  }));
}

export function registerUser(user) {
  const users = getUsers();

  const email = user.email.trim().toLowerCase();

  const exists = users.some(
    (item) =>
      String(item.email).toLowerCase() === email
  );

  if (
    email === DEMO_ADMIN.email.toLowerCase()
  ) {
    throw new Error(
      "This email is reserved for administration."
    );
  }

  if (exists) {
    throw new Error(
      "An account with this email already exists."
    );
  }

  const newUser = {
    id: `customer-${Date.now()}`,
    firstName: user.firstName,
    lastName: user.lastName,
    email: email,
    phone: user.phone,
    role: "customer",
  };

  users.push({
    ...newUser,
    password: user.password,
  });

  saveUsers(users);

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(newUser)
  );

  return newUser;
}

export function loginUser(email, password) {
  const cleanEmail = email.trim().toLowerCase();

  /*
   * Demo admin account.
   * This will later be replaced by the client's
   * real backend/API authentication.
   */
  if (
    cleanEmail === DEMO_ADMIN.email &&
    password === DEMO_ADMIN.password
  ) {
    const adminSession = {
      id: DEMO_ADMIN.id,
      firstName: DEMO_ADMIN.firstName,
      lastName: DEMO_ADMIN.lastName,
      email: DEMO_ADMIN.email,
      phone: DEMO_ADMIN.phone,
      role: "admin",
    };

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(adminSession)
    );

    return adminSession;
  }

  const users = getUsers();

  const user = users.find(
    (item) =>
      String(item.email).toLowerCase() === cleanEmail &&
      item.password === password
  );

  if (!user) {
    throw new Error(
      "Invalid email or password."
    );
  }

  const session = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role || "customer",
  };

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session)
  );

  return session;
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateSession(updates) {
  const current = getSession();

  if (!current) {
    throw new Error("No active session.");
  }

  const updated = {
    ...current,
    ...updates,
  };

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(updated)
  );

  return updated;
}
