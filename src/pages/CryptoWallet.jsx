import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Copy, RefreshCw, Zap } from "lucide-react";
import {
  getCryptoActivity,
  getCryptoRoutes,
  getWalletBalance,
  submitCryptoDeposit,
  submitCryptoWithdrawal,
} from "../services/api";
import "./CryptoWallet.css";

const banks = [
  "Access Bank", "Ecobank Nigeria", "Fidelity Bank", "First Bank of Nigeria",
  "First City Monument Bank", "Guaranty Trust Bank", "Keystone Bank",
  "Moniepoint MFB", "OPay", "Palmpay", "Polaris Bank", "Stanbic IBTC Bank",
  "Sterling Bank", "Union Bank", "United Bank for Africa", "Wema Bank", "Zenith Bank",
];
const symbols = { BTC: "₿", ETH: "◆", BNB: "⬡", SOL: "◎", TRX: "◇", USDT: "₮", USDC: "$" };
const naira = (n) => `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const makeKey = () => globalThis.crypto.randomUUID();

export default function CryptoWallet() {
  const [routes, setRoutes] = useState([]);
  const [activity, setActivity] = useState([]);
  const [balance, setBalance] = useState(0);
  const [route, setRoute] = useState(null);
  const [amount, setAmount] = useState("");
  const [hash, setHash] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bank, setBank] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [depositKey, setDepositKey] = useState(makeKey);
  const [withdrawKey, setWithdrawKey] = useState(makeKey);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    setError("");
    try {
      const [nextRoutes, nextActivity, wallet] = await Promise.all([
        getCryptoRoutes(), getCryptoActivity(), getWalletBalance(),
      ]);
      setRoutes(nextRoutes);
      setActivity(nextActivity);
      setBalance(Number(wallet?.balance || 0));
    } catch (err) {
      setError(err?.message || "Crypto information could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, []);

  async function copyAddress(address) {
    try {
      await navigator.clipboard.writeText(address);
      setMessage("Deposit address copied.");
    } catch {
      setMessage("Copy the deposit address manually.");
    }
  }

  async function deposit(event) {
    event.preventDefault();
    if (!route) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await submitCryptoDeposit({
        route_id: route.id, amount_usd: amount, transaction_hash: hash.trim(),
        idempotency_key: depositKey,
      });
      setMessage(result?.message || "Deposit submitted for review.");
      setAmount(""); setHash(""); setDepositKey(makeKey());
      await refresh();
    } catch (err) {
      setError(err?.message || "Deposit could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(event) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await submitCryptoWithdrawal({
        amount_minor: Math.round(Number(withdrawAmount) * 100),
        bank_code: bank.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        bank_name: bank, account_name: accountName.trim(),
        account_number: accountNumber, idempotency_key: withdrawKey,
      });
      setMessage(result?.message || "Withdrawal submitted for processing.");
      setWithdrawOpen(false); setWithdrawAmount(""); setBank(""); setAccountName("");
      setAccountNumber(""); setWithdrawKey(makeKey());
      await refresh();
    } catch (err) {
      setError(err?.message || "Withdrawal could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  const assets = Object.values(routes.reduce((groups, item) => {
    (groups[item.asset_code] ||= []).push(item);
    return groups;
  }, {}));

  return (
    <main className="bukzex-crypto">
      <header className="bx-crypto-header">
        <Link to="/customer"><ArrowLeft size={17} /> Dashboard</Link>
        <strong>BUKZ<span>EX</span></strong>
      </header>
      <div className="bx-crypto-content">
        <section className="bx-crypto-intro">
          <div><small>BUKZEX FINANCIAL SERVICES</small><h1>Crypto wallet</h1><p>Deposit supported crypto and request a bank withdrawal.</p></div>
          <button onClick={refresh} disabled={loading}><RefreshCw size={16} /> Refresh</button>
        </section>

        <section className="bx-crypto-balance">
          <div><small>BUKZEX WALLET BALANCE</small><strong>{loading ? "Loading…" : naira(balance)}</strong></div>
          <Zap size={25} />
          <div className="bx-crypto-actions">
            <a href="#assets">Deposit crypto <ArrowRight size={16} /></a>
            <button onClick={() => setWithdrawOpen(true)}>Withdraw to bank</button>
          </div>
          <p>Deposits are credited after confirmation.</p>
        </section>

        {error && <p className="bx-crypto-message error" role="alert">{error}</p>}
        {message && <p className="bx-crypto-message" role="status">{message}</p>}

        {route ? (
          <section className="bx-crypto-panel">
            <button className="bx-crypto-back" onClick={() => setRoute(null)}><ArrowLeft size={16} /> All assets</button>
            <h2>{route.asset_name} deposit</h2>
            <p className="bx-crypto-subtitle">{route.network_name} · {route.network_code}</p>
            <div className="bx-crypto-warning">Send {route.asset_code} on <strong>{route.network_name} only</strong>. Transfers on the wrong network may be lost.</div>
            <small className="bx-crypto-label">DEPOSIT ADDRESS</small>
            <div className="bx-crypto-address"><code>{route.deposit_address}</code><button onClick={() => copyAddress(route.deposit_address)} aria-label="Copy address"><Copy size={17} /></button></div>
            <div className="bx-crypto-facts">
              <span>Rate<strong>{naira(route.rate_ngn_per_usd)} / USD</strong></span>
              <span>Network fee<strong>${Number(route.network_fee_usd).toFixed(2)}</strong></span>
              <span>Minimum net<strong>${Number(route.minimum_deposit_usd).toFixed(2)}</strong></span>
            </div>
            <form className="bx-crypto-form" onSubmit={deposit}>
              <label>Deposit value (USD)<input required type="number" min={Number(route.minimum_deposit_usd) + Number(route.network_fee_usd)} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
              <p>Estimated credit: <strong>{naira(Math.max(0, Number(amount || 0) - Number(route.network_fee_usd)) * Number(route.rate_ngn_per_usd))}</strong></p>
              <label>Transaction hash<input required value={hash} onChange={(e) => setHash(e.target.value)} /></label>
              <button disabled={busy}>{busy ? "Submitting…" : "I have sent the crypto"}</button>
            </form>
          </section>
        ) : (
          <section className="bx-crypto-panel" id="assets">
            <div className="bx-crypto-panel-title"><div><small>SUPPORTED ASSETS</small><h2>Choose an asset</h2></div><span>● Active routes</span></div>
            {loading ? <p>Loading routes…</p> : assets.length ? <div className="bx-crypto-assets">
              {assets.map((group) => <article key={group[0].asset_code}>
                <div className="bx-crypto-asset-title"><b>{symbols[group[0].asset_code] || group[0].asset_code[0]}</b><span><strong>{group[0].asset_name} {group[0].asset_code}</strong><small>{group.length} network{group.length === 1 ? "" : "s"}</small></span></div>
                {group.map((item) => <button className="bx-crypto-network" key={item.id} onClick={() => setRoute(item)}><span><strong>{item.network_name}</strong><small>{item.network_code}</small></span><b>{naira(item.rate_ngn_per_usd)} / USD <ArrowRight size={15} /></b></button>)}
              </article>)}
            </div> : <p>No crypto routes are available right now.</p>}
          </section>
        )}

        <section className="bx-crypto-panel">
          <small className="bx-crypto-label">YOUR REQUESTS</small><h2>Recent activity</h2>
          {activity.length ? activity.slice(0, 10).map((item) => <article className="bx-crypto-activity" key={item.id}>
            <span><strong>{item.kind === "deposit" ? "Crypto deposit" : "Bank withdrawal"}</strong><small>{String(item.status || "pending").replaceAll("_", " ")} · {item.created_at ? new Date(item.created_at).toLocaleString() : ""}</small></span>
            <b>{item.kind === "deposit" ? `$${Number(item.amount_usd || 0).toFixed(2)}` : naira(Number(item.amount_minor || 0) / 100)}</b>
          </article>) : <p className="bx-crypto-muted">Your crypto requests will appear here.</p>}
        </section>
      </div>

      {withdrawOpen && <div className="bx-crypto-overlay" onClick={() => setWithdrawOpen(false)}>
        <form className="bx-crypto-modal" onSubmit={withdraw} onClick={(e) => e.stopPropagation()}>
          <div className="bx-crypto-panel-title"><h2>Withdraw to bank</h2><button type="button" onClick={() => setWithdrawOpen(false)}>×</button></div>
          <p>Funds are reserved while the request is processed. Rejected requests are refunded.</p>
          <label>Amount (NGN)<input required type="number" min="1" step="0.01" max={balance} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} /></label>
          <label>Bank<select required value={bank} onChange={(e) => setBank(e.target.value)}><option value="">Choose bank</option>{banks.map((name) => <option key={name}>{name}</option>)}</select></label>
          <label>Account name<input required value={accountName} onChange={(e) => setAccountName(e.target.value)} /></label>
          <label>Account number<input required inputMode="numeric" maxLength={10} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} /></label>
          <button className="bx-crypto-submit" disabled={busy}>{busy ? "Sending…" : "Request withdrawal"}</button>
        </form>
      </div>}
    </main>
  );
}
