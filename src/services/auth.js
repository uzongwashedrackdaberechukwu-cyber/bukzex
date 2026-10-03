import {
  createUserWithEmailAndPassword,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  setPersistence,
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
  const user = auth.currentUser;
  if (!user) return null;

  const [profileSnap, admin] = await Promise.all([
    getDoc(doc(db, "profiles", user.uid)),
    isAdmin(user.uid),
  ]);

  if (!profileSnap.exists()) {
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
  await setPersistence(auth, browserLocalPersistence);
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
  await setPersistence(auth, browserLocalPersistence);
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
