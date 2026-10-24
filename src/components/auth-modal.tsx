"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { BrandLockup } from "@/components/mark";
import { useAuthForm, type AuthAttempt } from "@/components/use-auth-form";
import { useAuth } from "@/context/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AuthModal() {
  const { authModal, closeAuthModal, signIn, signUp } = useAuth();
  const router = useRouter();
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const form = useAuthForm({
    initialMode: authModal.view,
    initialEmail: authModal.email,
    configured: isSupabaseConfigured,
  });
  const [openRequest, setOpenRequest] = useState(authModal);
  if (openRequest !== authModal) {
    setOpenRequest(authModal);
    if (authModal.isOpen) form.reset(authModal.view, authModal.email);
  }

  useEffect(() => {
    if (!authModal.isOpen) return;
    const dialog = dialogRef.current;
    const returnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.querySelector<HTMLInputElement>("input")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAuthModal();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocus?.focus();
    };
  }, [authModal.isOpen, closeAuthModal]);

  const attempt: AuthAttempt = async (mode, email, password) => {
    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) return { kind: "error", error };
      // Success - update router and close modal (stay on current page)
      router.refresh();
      closeAuthModal();
      return { kind: "done" };
    }

    const { error, needsConfirmation } = await signUp(email, password);
    if (error) return { kind: "error", error };
    if (needsConfirmation) return { kind: "check" };
    // Auto-confirmed - update router and close modal
    router.refresh();
    closeAuthModal();
    return { kind: "done" };
  };

  if (!authModal.isOpen) {
    return null;
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      data-testid="auth-modal"
      className="fixed inset-0 z-[10010] overflow-y-auto overscroll-contain bg-background"
    >
      <AuthPanel
        context="modal"
        headingId={headingId}
        view={form.view}
        code={authModal.code}
        onModeChange={form.changeMode}
        values={form.values}
        onValueChange={form.setValue}
        onSubmit={form.submitWith(attempt)}
        loading={form.loading}
        configured={isSupabaseConfigured}
        fieldErrors={form.fieldErrors}
        formError={form.formError}
        top={
          <div className="sa-top">
            <BrandLockup
              layout="horizontal"
              wordmark="mono"
              markSize={24}
              ink="cream"
              href={null}
              className="[&>span]:!gap-3"
              wordmarkClassName="text-[11px] tracking-[0.1em]"
            />
            <button type="button" className="sa-close" onClick={closeAuthModal}>
              Close
            </button>
          </div>
        }
      />
    </div>
  );
}
