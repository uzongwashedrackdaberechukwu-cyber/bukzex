import { ExternalLink, Link as LinkIcon, TrendingUp } from 'lucide-react';
import { socialTargetError } from '../../bukzex-shadex-catalog-worker/src/social-boost.js';
import './SocialBoostCheckout.css';

export default function SocialBoostCheckout({ item, price, targetLink, onTargetChange, disabled }) {
  const rawPlatform = String(item.platform || 'social media');
  const platform = rawPlatform.charAt(0).toUpperCase() + rawPlatform.slice(1);
  const issue = targetLink.trim() ? socialTargetError(targetLink, item.platform) : '';
  const amount = price ? Number(price.amount_minor) / 100 : null;
  return <section className="social-boost-checkout" aria-label="Social boost order details">
    <div className="social-boost-checkout-heading"><span className="social-boost-icon"><TrendingUp size={23} /></span><div><span className="social-boost-eyebrow">YOUR BOOST</span><h2>Add your profile or post link.</h2><p>Confirm your package, then add the exact profile or post to boost.</p></div></div>
    <div className="social-boost-summary"><div><span className="social-boost-platform">{platform}</span><h3>{item.name}</h3><p>{Number(item.quantity || 0).toLocaleString()} units · {item.category || 'Social promotion'}</p></div><strong>{amount === null ? 'Price unavailable' : `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`}</strong></div>
    <label className="social-boost-target-label" htmlFor="social-target-link"><LinkIcon size={17} /> Public {platform} profile or post link <span>Required</span></label>
    <input id="social-target-link" className="social-boost-target-input" type="url" name="target_link" required maxLength={1000} autoComplete="off" autoCapitalize="none" spellCheck={false} value={targetLink} onChange={event => onTargetChange(event.target.value)} disabled={disabled} aria-describedby="social-target-help social-target-error" aria-invalid={Boolean(issue)} placeholder={platform.toLowerCase() === 'facebook' ? 'https://www.facebook.com/your.profile' : 'https://…/your-profile-or-post'} />
    <p id="social-target-help" className="social-boost-target-help">For followers, use your profile link. For likes, views or comments, use the specific post or video link. Keep the target public while delivery is in progress.</p>
    <p id="social-target-error" className="social-boost-target-error" role="status">{issue}</p>
    {targetLink && !issue && <a className="social-boost-preview" href={targetLink.trim()} target="_blank" rel="noopener noreferrer">Open your target to check it <ExternalLink size={14} /></a>}
    <div className="social-boost-delivery-note"><strong>Payment accepted → Processing → Delivery confirmed</strong><p>Paying submits your order. Track the target, quantity and delivery status in Purchases. Delivery is marked completed only after supplier confirmation.</p></div>
  </section>;
}
