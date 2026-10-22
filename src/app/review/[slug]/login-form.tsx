"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  reviewLoginErrorMessage,
  type ReviewLoginError,
} from "@/lib/review/login-errors";

export function ReviewLoginForm({
  slug,
  error,
}: {
  slug: string;
  error: ReviewLoginError | null;
}) {
  const router = useRouter();
  const [clientError, setClientError] = useState<ReviewLoginError | null>(null);
  const [pending, setPending] = useState(false);
  const message = reviewLoginErrorMessage(clientError ?? error);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    setPending(true);
    try {
      const response = await fetch("/api/review/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          next: `/review/${slug}`,
        }),
      });
      if (response.status === 429) {
        setClientError("locked");
        return;
      }
      if (response.status === 401) {
        setClientError("password");
        return;
      }
      if (!response.ok) {
        setClientError("password");
        return;
      }
      router.push(`/review/${slug}`);
      router.refresh();
    } catch {
      setClientError("password");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
        Private QA
      </p>
      <h1 className="mt-3 font-heading text-3xl uppercase tracking-tight">
        Unlock review
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Enter the review password to open{" "}
        <span className="font-mono text-foreground">{slug}</span>.
      </p>
      {message ? (
        <p className="mt-4 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <form
        action="/api/review/login"
        method="post"
        className="mt-8 space-y-4"
        onSubmit={handleSubmit}
      >
        <input type="hidden" name="next" value={`/review/${slug}`} />
        <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="mt-2 h-11 w-full rounded-md border border-line bg-background px-3 text-base text-foreground outline-none focus-visible:border-primary"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-md bg-primary font-heading uppercase tracking-wide text-ink"
        >
          Unlock
        </button>
      </form>
    </main>
  );
}
