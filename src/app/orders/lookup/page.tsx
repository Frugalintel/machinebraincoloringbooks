"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function OrderLookupPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="shell-doc-main">
      <p className="mono shell-kicker text-signal">Orders</p>
      <h1 className="shell-h font-display">Order tracking.</h1>
      {submitted ? (
        <div className="shell-note">
          <p>
            Tracking isn&apos;t live yet. Your confirmation email has your order
            details.
          </p>
          <p>
            <Link href="/help#orders">Orders and shipping</Link>
          </p>
        </div>
      ) : (
        <form className="shell-form" onSubmit={handleLookup}>
          <div>
            <label className="mono" htmlFor="order-number">
              Order number
            </label>
            <input
              id="order-number"
              name="order"
              className="shell-field"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="Order number"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="mono" htmlFor="order-email">
              Email
            </label>
            <input
              id="order-email"
              name="email"
              type="email"
              className="shell-field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
              required
            />
          </div>
          <button type="submit" className="btn">
            Look up
          </button>
        </form>
      )}
    </main>
  );
}
