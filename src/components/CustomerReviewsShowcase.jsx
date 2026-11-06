import { useEffect, useState } from "react";
import { MessageCircle, Star } from "lucide-react";
import { getBukzExPublicReviews } from "../services/api";
import "./CustomerReviewsShowcase.css";

export default function CustomerReviewsShowcase() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let active = true;
    getBukzExPublicReviews()
      .then((items) => {
        if (active) setReviews(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (active) setReviews([]);
      });
    return () => { active = false; };
  }, []);

  if (!reviews.length) return null;
  const average = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;

  return (
    <section className="bx-customer-reviews" id="customer-reviews">
      <div className="bx-wrap">
        <div className="bx-customer-reviews-heading">
          <div>
            <span><MessageCircle size={14} /> VERIFIED CUSTOMER FEEDBACK</span>
            <h2>Experiences from the <em>BukzEx community.</em></h2>
            <p>Reviews come from verified BukzEx purchases and are published only with customer permission after moderation.</p>
          </div>
          <div className="bx-customer-review-average">
            <div>{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={15} className={value <= Math.round(average) ? "filled" : ""} />)}</div>
            <strong>{average.toFixed(1)} / 5</strong>
            <small>{reviews.length} recent published reviews</small>
          </div>
        </div>
        <div className="bx-customer-review-grid">
          {reviews.map((review, index) => (
            <article key={review.order_id || review.created_at || index}>
              <div className="bx-customer-review-card-top">
                <strong>{review.service_name || "BukzEx service"}</strong>
                <span><Star size={13} className="filled" /> {review.rating}/5</span>
              </div>
              <p>“{review.feedback}”</p>
              <small>Verified BukzEx customer</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
