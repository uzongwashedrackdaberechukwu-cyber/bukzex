import { requireSupabase } from "../lib/supabase";

function toProfile(profile, email = "") {
  return {
    id: profile.id,
    firstName: profile.first_name || "",
    lastName: profile.last_name || "",
    email,
    phone: profile.phone || "",
    role: profile.role || "customer",
    notificationsEnabled: profile.notifications_enabled ?? true,
  };
}

export async function getSession() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();

  if (error || !data?.user) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id, email, first_name, last_name, phone, role, notifications_enabled")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) throw new Error("Your account profile is not ready yet. Please contact support.");

  return toProfile(profile, profile.email || data.user.email || "");
}

export async function isAuthenticated() {
  return Boolean(await getSession());
}

export async function getRegisteredUsers() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("id, email, first_name, last_name, phone, role, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((profile) =>
    toProfile(profile, profile.email || "")
  );
}

export async function registerUser(user) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: user.email.trim().toLowerCase(),
    password: user.password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: {
        first_name: user.firstName.trim(),
        last_name: user.lastName.trim(),
        phone: user.phone.trim(),
      },
    },
  });

  if (error) throw error;

  if (!data.session) {
    return { needsEmailConfirmation: true };
  }

  return getSession();
}

export async function loginUser(email, password) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return getSession();
}

export async function requestPasswordReset(email) {
  const client = requireSupabase();
  const { error } = await client.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: `${window.location.origin}/reset-password` }
  );
  if (error) throw error;
}

export async function updatePassword(password) {
  const client = requireSupabase();
  const { error } = await client.auth.updateUser({ password });
  if (error) throw error;
}

export async function logoutUser() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function updateSession(updates) {
  const client = requireSupabase();
  const current = await getSession();

  if (!current) throw new Error("Sign in to update your profile.");

  const { error } = await client
    .from("profiles")
    .update({
      first_name: updates.firstName,
      last_name: updates.lastName,
      phone: updates.phone,
      notifications_enabled: updates.notificationsEnabled,
    })
    .eq("id", current.id);

  if (error) throw error;
  return getSession();
}
