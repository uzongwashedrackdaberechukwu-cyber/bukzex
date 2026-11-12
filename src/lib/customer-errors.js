// Keep internal authentication, provider, and transport failures out of customer-facing UI.
// Do not infer that a refund occurred unless the underlying result explicitly confirms it.
const technicalDetails =
  /(?:firebase|firestore|auth\/[a-z-]+|http\s*\d{3}|upstream|shadexgoltd|stack trace|endpoint|internal server|api\/|network-request-failed|invalid-credential|permission-denied|failed to fetch|typeerror|referenceerror|syntaxerror|\bexception\b)/i;

const readMessage = (error) => {
  if (typeof error === "string") return error.trim();
  return String(error?.message || "").trim();
};

export function isConfirmedWalletRefund(error) {
  const message = readMessage(error);
  if (/\b(?:no refund|refund (?:pending|not yet|has not)|not refunded|refund has not)\b/i.test(message)) return false;
  return /(?:your (?:bukzex )?wallet (?:has been|was) refunded|your (?:payment|balance) (?:has been|was) refunded|supplier payment was reversed)/i.test(message);
}

export function authErrorMessage(error, action = "login") {
  const code = String(error?.code || "").toLowerCase();
  const message = readMessage(error);
  const key = code || message.toLowerCase();

  if (/email-already-in-use|email-already-exists/.test(key))
    return "This email is already registered. Sign in or use Forgot password to recover your account.";
  if (/invalid-email/.test(key))
    return "Enter a valid email address.";
  if (/invalid-credential|wrong-password|user-not-found|invalid-login-credentials/.test(key))
    return "We couldn't sign you in. Check your email and password, or use Forgot password.";
  if (/weak-password/.test(key))
    return "Choose a stronger password with at least 8 characters.";
  if (/too-many-requests/.test(key))
    return "Too many attempts. Try again later or use Forgot password.";
  if (/network-request-failed|network.*fail|failed to fetch/.test(key))
    return "We couldn't connect right now. Check your internet and try again.";
  if (/user-disabled/.test(key))
    return "This account is unavailable. Contact BukzEx Customer Care for help.";
  if (/expired-action-code|invalid-action-code/.test(key))
    return "This link has expired or has already been used. Please request a new one.";
  if (/requires-recent-login/.test(key))
    return "For your security, please sign in again before continuing.";
  if (/operation-not-allowed|unauthorized-domain/.test(key))
    return "Account access is temporarily unavailable. Please contact BukzEx Customer Care.";
  if (/permission-denied|insufficient permissions/.test(key))
    return "We couldn't access your account details. Please contact BukzEx Customer Care.";

  if (action === "signup")
    return "We couldn't finish creating your account. If you have registered before, sign in or reset your password.";
  if (action === "reset")
    return "We couldn't send the reset link right now. Please try again shortly.";
  if (action === "changePassword")
    return "We couldn't change your password. Please request a fresh reset link or contact support.";
  return "We couldn't sign you in right now. Please try again or use Forgot password.";
}

export function friendlyErrorMessage(error, fallback = "We couldn't complete this request. Please try again.") {
  const message = readMessage(error);
  const code = String(error?.code || "");
  if (/^auth\//i.test(code) || /^auth\//i.test(message)) return authErrorMessage(error);
  if (/permission-denied|insufficient permissions/.test(code + " " + message))
    return "We couldn't access this information. Please sign in again or contact Customer Care.";
  if (/network.*fail|failed to fetch|network-request-failed/i.test(code + " " + message))
    return "Connection problem. Check your internet and try again.";
  if (/too-many-requests|rate limit/i.test(code + " " + message))
    return "Too many attempts. Please try again later.";

  if (message && message.length <= 220 && !technicalDetails.test(message) &&
    /^(?:enter|choose|please|your|you|this|the|we|no |only|not enough|insufficient|unable|deposit|order|account|payment|service)\b/i.test(message)) {
    return message;
  }
  return fallback;
}

export function purchaseErrorMessage(error, fallback = "We couldn't complete this purchase. Check Purchases before trying again, or contact BukzEx Customer Care.") {
  const message = readMessage(error);
  if (isConfirmedWalletRefund(error))
    return "This order couldn't be completed. Your BukzEx wallet has been refunded. Check Purchases for details.";
  if (/refund (?:is )?pending|refund (?:has not|not yet)|refund is being reviewed|refund.*not confirmed|refund.*not issued/i.test(message))
    return "This order couldn't be completed, but the refund is not yet confirmed. Check Purchases or contact Customer Care before paying again.";
  if (/insufficient (?:wallet )?(?:funds|balance)|not enough (?:wallet )?(?:money|balance)/i.test(message))
    return "Your wallet balance is too low for this purchase. Add money or choose another service.";
  if (/payment reference was already used|idempotency.*conflict|already submitted/i.test(message))
    return "This purchase request may already have been submitted. Check Purchases before trying again.";
  if (/no refund|http\s*\d{3}|shadexgoltd|supplier|upstream|network|connection|timeout|fetch/i.test(message))
    return "We couldn't confirm the order yet. Check Purchases or contact Customer Care before trying again to avoid another charge.";
  return friendlyErrorMessage(error, fallback);
}
