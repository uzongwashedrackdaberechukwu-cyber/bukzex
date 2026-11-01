const HOSTS = {
  facebook: ['facebook.com', 'fb.watch'], instagram: ['instagram.com'],
  tiktok: ['tiktok.com'], youtube: ['youtube.com', 'youtu.be'],
  telegram: ['t.me', 'telegram.me'], x: ['x.com', 'twitter.com'], twitter: ['x.com', 'twitter.com'],
  spotify: ['open.spotify.com'], threads: ['threads.net', 'threads.com'],
  linkedin: ['linkedin.com'], snapchat: ['snapchat.com'],
};
export function socialTargetError(raw, platform = '') {
  if (!String(raw || '').trim()) return 'Paste the public profile or post link you want to boost.';
  if (String(raw).length > 1000) return 'The target link is too long. Use the original profile or post URL.';
  try {
    const url = new URL(String(raw).trim());
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) {
      return 'Use a complete public link beginning with https://.';
    }
    const hosts = HOSTS[String(platform).toLowerCase()];
    if (hosts && !hosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host))) {
      return `Use a ${platform} profile or post link for this package.`;
    }
    if (url.pathname === '/' && !url.search) return 'Paste the link to your actual profile or post, not the platform homepage.';
    return '';
  } catch { return 'Paste the full https:// link, rather than only an @username.'; }
}
export function socialDisplayStatus(order) {
  const status = String(order?.status || '').trim().toLowerCase();
  if (String(order?.payment_status || '').toLowerCase() === 'refunded' || status === 'refunded') return 'refunded';
  if (['failed', 'rejected', 'cancelled', 'canceled', 'expired'].includes(status)) return status;
  if (order?.delivery_confirmed === true && ['completed', 'complete', 'delivered', 'fulfilled'].includes(status)) return 'completed';
  if (status === 'partial') return 'partial';
  if (status === 'review') return 'review';
  return 'processing';
}
export function socialOrderDetails(upstream, saved = {}) {
  return {
    platform: String(upstream.platform || saved.platform || ''),
    target_link: String(upstream.target_link || saved.target_link || ''),
    quantity: Number(upstream.quantity ?? saved.quantity ?? 0),
    start_count: upstream.start_count ?? saved.start_count ?? null,
    remains: upstream.remains ?? saved.remains ?? null,
    delivery_confirmed: upstream.delivery_confirmed === true,
    delivery_checked_at: upstream.delivery_checked_at || null,
  };
}
