"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
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
    <main
      id="main"
      className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16"
    >
      <p className="font-label tracking-[0.12em] text-signal">Private QA</p>
      <h1 className="mt-3 font-display text-title text-cream">Unlock review</h1>
      <p className="mt-3 text-base text-fg-muted">
        Enter the review password to open{" "}
        <span className="font-mono text-cream">{slug}</span>.
      </p>
      {message ? <FieldError className="mt-4">{message}</FieldError> : null}
      <form
        action="/api/review/login"
        method="post"
        className="mt-8 flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <input type="hidden" name="next" value={`/review/${slug}`} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="review-password">Password</Label>
          <Input
            id="review-password"
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" loading={pending}>
          Unlock
        </Button>
      </form>
    </main>
  );
}
