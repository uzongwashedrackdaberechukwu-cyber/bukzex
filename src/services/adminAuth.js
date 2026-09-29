const ADMIN_SESSION_KEY = "bukzex_admin_session";

const DEMO_ADMIN = {
  email: "admin@bukzex.com",
  password: "admin123",
  name: "BukzEx Admin",
};

export function getAdminSession() {
  try {
    return JSON.parse(
      localStorage.getItem(ADMIN_SESSION_KEY) || "null"
    );
  } catch {
    return null;
  }
}

export function isAdminAuthenticated() {
  return Boolean(getAdminSession());
}

export function loginAdmin(email, password) {
  if (
    email.trim().toLowerCase() !== DEMO_ADMIN.email ||
    password !== DEMO_ADMIN.password
  ) {
    throw new Error("Invalid admin email or password.");
  }

  const session = {
    id: "admin-demo",
    name: DEMO_ADMIN.name,
    email: DEMO_ADMIN.email,
    role: "admin",
  };

  localStorage.setItem(
    ADMIN_SESSION_KEY,
    JSON.stringify(session)
  );

  return session;
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
