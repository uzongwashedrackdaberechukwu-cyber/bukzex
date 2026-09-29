import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  LoaderCircle,
} from "lucide-react";

import {
  createDeposit,
  getDepositStatus,
} from "../services/api";

import "./FundWallet.css";

const BANK_DETAILS = {
  bank: "OPay",
  accountNumber: "6402493498",
  accountName: "MATTHEW CHUKWUEBUKA AGU",
};

export default function FundWallet({ onBack }) {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [depositId, setDepositId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!depositId || status !== "pending") {
      return;
    }

    let cancelled = false;

    const checkStatus = async () => {
      try {
        const result = await getDepositStatus(depositId);

        if (cancelled) return;

        if (result.status === "confirmed") {
          setStatus("confirmed");
          setMessage(
            "Your wallet has been updated."
          );
          return;
        }

        if (result.status === "failed") {
          setStatus("failed");
          setMessage(
            result.message ||
              "The deposit could not be confirmed."
          );
        }

        if (result.status === "rejected") {
          setStatus("failed");
          setMessage("The deposit was not confirmed. Please contact support.");
        }
      } catch {
        // The API may not be connected yet.
        // Leave the deposit in pending state.
      }
    };

    checkStatus();

    const interval = setInterval(
      checkStatus,
      60000
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [depositId, status]);

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(
        BANK_DETAILS.accountNumber
      );

      setMessage("Account number copied.");
    } catch (err) {
      setMessage(
        "Copy the account number manually."
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanReference = reference.trim();
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setStatus("error");
      setMessage("Enter the amount you transferred.");
      return;
    }

    if (!cleanReference) {
      setStatus("error");
      setMessage(
        "Enter your transfer reference."
      );
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const result =
        await createDeposit(cleanReference, numericAmount);

      setDepositId(result.depositId || result.id);
      setStatus("pending");

      setMessage(
        "Pending deposits usually take up to 1 minute for confirmation."
      );
    } catch {
      /*
       * Until the client's API is connected,
       * the frontend cannot actually validate
       * a bank transfer.
       */
      setStatus("error");

        setMessage(err?.message || "Unable to submit this deposit request.");
    }
  };

  if (status === "confirmed") {
    return (
      <section className="fund-wallet">

        <button
          type="button"
          className="fund-back"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="fund-result">

          <div className="fund-result-icon success">
            <CheckCircle2 size={28} />
          </div>

          <h2>Deposit Confirmed</h2>

          <p>
            Your wallet has been updated successfully.
          </p>

          <button
            type="button"
            className="fund-primary-button"
            onClick={onBack}
          >
            Return to Wallet
          </button>

        </div>

      </section>
    );
  }

  if (status === "pending") {
    return (
      <section className="fund-wallet">

        <button
          type="button"
          className="fund-back"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="fund-result">

          <div className="fund-result-icon pending">
            <Clock3 size={28} />
          </div>

          <h2>Deposit Pending</h2>

          <p>
            The administrator will review your transfer and update its status.
          </p>

          <div className="fund-reference">
            Reference:
            <strong>{reference}</strong>
          </div>

          <div className="fund-checking">
            <LoaderCircle size={15} />
            Waiting for administrator review
          </div>

        </div>

      </section>
    );
  }

  return (
    <section className="fund-wallet">

      <button
        type="button"
        className="fund-back"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="fund-heading">
        <span>WALLET</span>
        <h2>Fund Wallet</h2>
        <p>
          Transfer to the account below, then submit
          your transfer reference.
        </p>
      </div>

      <div className="fund-account">

        <div className="fund-account-row">
          <span>Bank</span>
          <strong>{BANK_DETAILS.bank}</strong>
        </div>

        <div className="fund-account-row">
          <span>Account Name</span>
          <strong>
            {BANK_DETAILS.accountName}
          </strong>
        </div>

        <div className="fund-account-row account-number">
          <div>
            <span>Account Number</span>
            <strong>
              {BANK_DETAILS.accountNumber}
            </strong>
          </div>

          <button
            type="button"
            onClick={copyAccountNumber}
            aria-label="Copy account number"
          >
            <Copy size={16} />
          </button>
        </div>

      </div>

      <form
        className="fund-form"
        onSubmit={handleSubmit}
      >

        <label htmlFor="deposit-amount">
          Transfer Amount
        </label>

        <input
          id="deposit-amount"
          type="number"
          min="1"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
            setStatus("idle");
            setMessage("");
          }}
          placeholder="Enter amount"
          autoComplete="off"
        />

        <label htmlFor="deposit-reference">
          Transfer Reference
        </label>

        <input
          id="deposit-reference"
          type="text"
          value={reference}
          onChange={(event) => {
            setReference(event.target.value);
            setStatus("idle");
            setMessage("");
          }}
          placeholder="Enter your transfer reference"
          autoComplete="off"
        />

        {message && (
          <p
            className={`fund-message ${
              status === "error"
                ? "error"
                : ""
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          className="fund-primary-button"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? (
            <>
              <LoaderCircle
                size={15}
                className="fund-spinner"
              />
              Submitting
            </>
          ) : (
            "Submit Deposit"
          )}
        </button>

      </form>

    </section>
  );
}
