import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, authPersistenceReady, db } from "../lib/firebase";

function toProfile(profile, email = "", role = "customer") {
  return {
    id: profile.id,
    firstName: profile.first_name || "",
    lastName: profile.last_name || "",
    email: email || profile.email || "",
    phone: profile.phone || "",
    role,
    notificationsEnabled: profile.notifications_enabled ?? true,
  };
}

function requireUser() {
  if (!auth.currentUser) throw new Error("Sign in to continue.");
  return auth.currentUser;
}

async function isAdmin(uid) {
  const adminDoc = await getDoc(doc(db, "admins", uid));
  return adminDoc.exists();
}

export async function getSession() {
  // Wait until Firebase has restored its saved browser session before
  // deciding that the user is signed out after a page refresh.
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return null;

  const [profileSnap, admin] = await Promise.all([
    getDoc(doc(db, "profiles", user.uid)),
    isAdmin(user.uid),
  ]);

  if (!profileSnap.exists()) {
    // Some administrator accounts are created directly in /admins and do
    // not have a customer /profiles record. Keep those signed-in admins in
    // the admin area after a refresh instead of treating them as signed out.
    if (admin) {
      const nameParts = String(user.displayName || "").trim().split(/\s+/).filter(Boolean);
      return {
        id: user.uid,
        firstName: nameParts[0] || "Admin",
        lastName: nameParts.slice(1).join(" "),
        email: user.email || "",
        phone: "",
        role: "admin",
        notificationsEnabled: true,
      };
    }
    throw new Error("Your account profile is not ready yet. Please contact support.");
  }

  return toProfile(
    profileSnap.data(),
    user.email || "",
    admin ? "admin" : "customer"
  );
}

export async function isAuthenticated() {
  return Boolean(await getSession());
}

export async function getRegisteredUsers() {
  const user = requireUser();
  if (!(await isAdmin(user.uid))) {
    throw new Error("Administrator access required.");
  }

  const result = await getDocs(
    query(collection(db, "profiles"), orderBy("created_at", "desc"))
  );

  return result.docs.map((profileDoc) =>
    toProfile(profileDoc.data(), profileDoc.data().email || "", "customer")
  );
}

export async function registerUser(user) {
  await authPersistenceReady;
  const email = user.email.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    user.password
  );
  const uid = credential.user.uid;

  await setDoc(doc(db, "profiles", uid), {
    id: uid,
    email,
    first_name: user.firstName.trim(),
    last_name: user.lastName.trim(),
    phone: user.phone.trim(),
    notifications_enabled: true,
    role: "customer",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await setDoc(doc(db, "wallets", uid), {
    user_id: uid,
    balance: 0,
    currency: "NGN",
    updated_at: serverTimestamp(),
  });

  return getSession();
}

export async function loginUser(email, password) {
  await authPersistenceReady;
  await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  return getSession();
}

export async function requestPasswordReset(email) {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase(), {
    url: window.location.origin + "/login",
    handleCodeInApp: false,
  });
}

export async function updatePassword(password) {
  const user = requireUser();
  await firebaseUpdatePassword(user, password);
}

export async function logoutUser() {
  await signOut(auth);
}

export async function updateSession(updates) {
  const user = requireUser();

  await updateDoc(doc(db, "profiles", user.uid), {
    first_name: updates.firstName,
    last_name: updates.lastName,
    phone: updates.phone,
    notifications_enabled: updates.notificationsEnabled,
    updated_at: serverTimestamp(),
  });

  return getSession();
}
