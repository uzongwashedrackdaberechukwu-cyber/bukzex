import { useCallback, useEffect, useState } from "react";
import { Check, LoaderCircle, MessageSquareText, RefreshCw, Star, X } from "lucide-react";
import { getBukzExAdminReviews, moderateBukzExReview } from "../../services/api";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReviews(await getBukzExAdminReviews());
    } catch (loadError) {
      setError(loadError?.message || "BukzEx reviews could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function moderate(review, status) {
    setBusyId(review.id);
    setError("");
    try {
      await moderateBukzExReview(review.id, status);
      await load();
    } catch (moderationError) {
      setError(moderationError?.message || "Review moderation failed.");
    } finally {
      setBusyId("");
    }
  }

  const pending = reviews.filter((review) => review.status === "pending").length;

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <div>
          <span>BUKZEX CUSTOMER EXPERIENCE</span>
          <h2>Customer reviews</h2>
          <p>Moderate reviews submitted by verified BukzEx purchasers. Only approved positive reviews with customer permission appear on the BukzEx website.</p>
        </div>
        <button type="button" className="admin-refresh-btn" onClick={load} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      <div className="admin-review-summary">
        <span><MessageSquareText size={17} /> {reviews.length} total reviews</span>
        <strong>{pending} awaiting moderation</strong>
      </div>
      {error ? <p className="admin-review-error" role="alert">{error}</p> : null}
      {loading ? (
        <div className="admin-review-empty"><LoaderCircle className="admin-review-spin" size={20} /> Loading BukzEx reviews…</div>
      ) : reviews.length ? (
        <div className="admin-review-list">
          {reviews.map((review) => (
            <article className="admin-review-card" key={review.id}>
              <div className="admin-review-card-head">
                <div>
                  <strong>{review.service_name || "BukzEx service"}</strong>
                  <small>Customer {String(review.user_id || "").slice(0, 8)}… · Order {String(review.order_id || "").slice(0, 14)}</small>
                </div>
                <span className={"admin-review-status " + (review.status === "approved" ? "approved" : review.status === "rejected" ? "rejected" : "pending")}>{review.status || "pending"}</span>
              </div>
              <div className="admin-review-stars">{[1,2,3,4,5].map((star) => <Star key={star} size={14} className={star <= Number(review.rating) ? "selected" : ""} />)} <b>{review.rating}/5</b></div>
              <p>{review.feedback}</p>
              <small className="admin-review-consent">{review.publish_consent ? "Customer consented to public display." : "Private feedback only — no public display consent."}</small>
              {review.status === "pending" ? (
                <div className="admin-review-actions">
                  <button type="button" disabled={busyId === review.id} onClick={() => moderate(review, "approved")}>
                    {busyId === review.id ? <LoaderCircle className="admin-review-spin" size={14} /> : <Check size={14} />} Approve
                  </button>
                  <button type="button" disabled={busyId === review.id} onClick={() => moderate(review, "rejected")}>
                    <X size={14} /> Reject
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-review-empty">No BukzEx customer reviews have been submitted yet.</div>
      )}
    </section>
  );
}
