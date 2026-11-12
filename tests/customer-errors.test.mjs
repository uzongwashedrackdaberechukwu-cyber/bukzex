import test from "node:test";
import assert from "node:assert/strict";

import {
  authErrorMessage,
  friendlyErrorMessage,
  isConfirmedWalletRefund,
  purchaseErrorMessage,
} from "../src/lib/customer-errors.js";

test("registered email gives clear recovery guidance, not Firebase errors", () => {
  const message = authErrorMessage({ code: "auth/email-already-in-use", message: "Firebase: Error (auth/email-already-in-use)." }, "signup");
  assert.match(message, /already registered/i);
  assert.match(message, /forgot password/i);
  assert.doesNotMatch(message, /firebase|auth\//i);
});

test("invalid sign-in does not leak Firebase wording or assert that the password is wrong", () => {
  const message = authErrorMessage({ code: "auth/invalid-credential", message: "Firebase: Error (auth/invalid-credential)." });
  assert.match(message, /couldn't sign you in/i);
  assert.match(message, /forgot password/i);
  assert.doesNotMatch(message, /firebase|auth\//i);
});

test("confirmation and network failures have actionable, nontechnical messages", () => {
  assert.match(authErrorMessage({ code: "auth/expired-action-code" }, "reset"), /expired/i);
  assert.match(authErrorMessage({ code: "auth/network-request-failed" }), /internet/i);
  assert.match(authErrorMessage({ code: "auth/too-many-requests" }), /too many/i);
});

test("confirmed supplier reversal shows a clear refund, without HTTP status or provider", () => {
  const raw = "BukzEx returned HTTP 422: BukzEx could not activate this service; the supplier payment was reversed. Your BukzEx wallet has been refunded.";
  assert.equal(isConfirmedWalletRefund(raw), true);
  const display = purchaseErrorMessage({ message: raw, status: 422 });
  assert.match(display, /wallet has been refunded/i);
  assert.doesNotMatch(display, /422|HTTP|supplier|ShadexGoLtd|Firebase/i);
});

test("unconfirmed supplier failure must not claim a refund", () => {
  const raw = "ShadexGoLtd returned HTTP 503: provider unavailable. No refund or second charge was applied.";
  assert.equal(isConfirmedWalletRefund(raw), false);
  const display = purchaseErrorMessage(raw);
  assert.match(display, /Check Purchases/i);
  assert.doesNotMatch(display, /has been refunded|HTTP|503|ShadexGoLtd/i);
});

test("refund still pending uses a separate message", () => {
  const display = purchaseErrorMessage("The refund is pending. Contact Customer Care.");
  assert.match(display, /not yet confirmed/i);
  assert.doesNotMatch(display, /has been refunded/i);
});

test("normal customer validation messages remain readable", () => {
  assert.equal(friendlyErrorMessage("Choose a data plan."), "Choose a data plan.");
  assert.equal(friendlyErrorMessage("Enter a phone number."), "Enter a phone number.");
});

test("technical or stack messages are replaced, not shown", () => {
  const fallback = "Please try again.";
  assert.equal(friendlyErrorMessage("TypeError: Cannot read property of undefined", fallback), fallback);
  assert.equal(friendlyErrorMessage("Firebase: Error (auth/permission-denied).", fallback), "We couldn't access this information. Please sign in again or contact Customer Care.");
});
