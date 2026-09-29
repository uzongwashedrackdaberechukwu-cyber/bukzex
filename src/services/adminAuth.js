import { getSession, loginUser, logoutUser } from "./auth";

export async function getAdminSession() {
  const user = await getSession();
  return user?.role === "admin" ? user : null;
}

export async function isAdminAuthenticated() {
  return Boolean(await getAdminSession());
}

export async function loginAdmin(email, password) {
  const user = await loginUser(email, password);
  if (user?.role !== "admin") {
    await logoutUser();
    throw new Error("This account does not have administrator access.");
  }
  return user;
}

export { logoutUser as logoutAdmin };
