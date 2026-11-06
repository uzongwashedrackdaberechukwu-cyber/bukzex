import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, Send, Star } from "lucide-react";
import { getCustomerReviewStatus, submitCustomerReview } from "../services/api";
import "./CustomerReviewCard.css";

const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

export default function CustomerReviewCard({ order }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [publishConsent, setPublishConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [eligible, setEligible] = useState(false);

  const createdAt = order?.createdAt || order?.created_at || order?.date;
  const createdTime = createdAt ? Date.parse(createdAt) : NaN;
  const paymentStatus = String(order?.payment_status || "").toLowerCase();

  useEffect(() => {
    let active = true;
    if (paymentStatus !== "paid" || !Number.isFinite(createdTime)) {
      return () => { active = false; };
    }
    const delay = Math.max(0, FORTY_EIGHT_HOURS - (Date.now() - createdTime));
    const timer = setTimeout(() => {
      if (active) setEligible(true);
    }, delay);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [paymentStatus, createdTime]);

  useEffect(() => {
    let active = true;
    if (!eligible) return () => { active = false; };
    getCustomerReviewStatus(order?.id || order?.orderId)
      .then((result) => {
        if (active && result.reviewed) setSubmitted(true);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => { active = false; };
  }, [eligible, order?.id, order?.orderId]);

  if (!eligible || paymentStatus !== "paid") return null;
  if (checking) return <p className="bx-review-checking">Checking your review status…</p>;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!rating) {
      setError("Choose a star rating before submitting.");
      return;
    }
    if (feedback.trim().length < 3) {
      setError("Please add a little feedback before submitting.");
      return;
    }
    setBusy(true);
    try {
      await submitCustomerReview(order.id || order.orderId, rating, feedback.trim(), publishConsent);
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError?.message || "Your review could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <section className="bx-review-form bx-review-submitted" aria-live="polite">
        <CheckCircle2 size={19} />
        <div>
          <strong>Thank you for your feedback.</strong>
          <p>Your review has been submitted for BukzEx moderation.</p>
        </div>
      </section>
    );
  }

  return (
    <form className="bx-review-form" onSubmit={handleSubmit}>
      <div className="bx-review-form-heading">
        <div>
          <span>YOUR EXPERIENCE MATTERS</span>
          <h3>How was this service?</h3>
        </div>
        <span className="bx-review-verified">Verified purchase</span>
      </div>
      <div className="bx-review-stars" role="group" aria-label="Rate this purchase">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={value + " star" + (value === 1 ? "" : "s")}
            aria-pressed={rating === value}
            onClick={() => setRating(value)}
          >
            <Star className={value <= rating ? "is-selected" : ""} size={25} />
          </button>
        ))}
      </div>
      <label className="bx-review-label">
        Your feedback
        <textarea
          rows={3}
          maxLength={2000}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="Tell us what went well or what we could improve..."
        />
      </label>
      <label className="bx-review-consent">
        <input type="checkbox" checked={publishConsent} onChange={(event) => setPublishConsent(event.target.checked)} />
        <span>I give BukzEx permission to publish this review on the BukzEx website if it is approved. My email and account details will not be displayed.</span>
      </label>
      {error ? <p className="bx-review-error" role="alert">{error}</p> : null}
      <button className="bx-review-submit" type="submit" disabled={busy}>
        {busy ? <LoaderCircle className="bx-review-spin" size={16} /> : <Send size={15} />}
        {busy ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
