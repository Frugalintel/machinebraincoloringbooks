"use client";

import { useState, useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import { useAuth } from "@/context/auth-context";
import {
  AUTH_COPY,
  AUTH_PASSWORD_MIN_LENGTH,
  authErrorMessage,
  type AuthFieldErrors,
  type AuthMode,
} from "@/lib/auth-ui";
import { isSupabaseConfigured } from "@/lib/supabase";
import { FOCUS_RING } from "@/lib/ui-brand";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AuthModal() {
  const { authModal, closeAuthModal, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authModal.isOpen) {
      setIsLogin(authModal.view === "login");
      if (authModal.email) setEmail(authModal.email);
      setFieldErrors({});
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [authModal]);

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
      const focusable = [
        ...dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
      ].filter((node) => !node.closest("fieldset:disabled"));
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

  const changeMode = (mode: AuthMode) => {
    setIsLogin(mode === "login");
    setFieldErrors({});
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});
    setErrorMsg("");
    setSuccessMsg("");

    // Validation
    if (!email || !password) {
      setFieldErrors({
        ...(email ? {} : { email: AUTH_COPY.emailRequired }),
        ...(password ? {} : { password: AUTH_COPY.passwordRequired }),
      });
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setFieldErrors({ confirmPassword: AUTH_COPY.passwordMismatch });
      setLoading(false);
      return;
    }

    if (!isLogin && password.length < AUTH_PASSWORD_MIN_LENGTH) {
      setFieldErrors({ password: AUTH_COPY.passwordTooShort });
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg(AUTH_COPY.notConfigured);
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(authErrorMessage(error));
          return;
        }
        // Success - update router and close modal (stay on current page)
        router.refresh();
        closeAuthModal();
        return;
      } else {
        const { error, needsConfirmation } = await signUp(email, password);
        if (error) {
          if (
            error.message.includes("already registered") ||
            error.message.includes("already exists")
          ) {
            setIsLogin(true);
            setErrorMsg(AUTH_COPY.accountExists);
          } else {
            setErrorMsg(error.message);
          }
          return;
        }

        if (needsConfirmation) {
          setSuccessMsg(AUTH_COPY.confirmEmail);
        } else {
          // Auto-confirmed - update router and close modal
          router.refresh();
          closeAuthModal();
          return;
        }
      }
    } catch (error: unknown) {
      setErrorMsg(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (!authModal.isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10010] overflow-y-auto overscroll-contain">
      <div
        aria-hidden="true"
        data-testid="auth-modal-backdrop"
        className="fixed inset-0 bg-background/90"
        onClick={closeAuthModal}
      />
      <div className="pointer-events-none relative flex min-h-full justify-center md:items-center md:p-8">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-testid="auth-modal"
          className="pointer-events-auto relative flex w-full justify-center bg-background px-5 pt-16 pb-10 md:max-w-[480px] md:border md:border-line md:px-10 md:pt-14"
        >
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Close"
            className={cn(
              "absolute top-[max(0.5rem,env(safe-area-inset-top))] right-2 flex size-11 items-center justify-center text-fg-secondary transition-colors hover:text-cream",
              FOCUS_RING,
            )}
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
          <AuthPanel
            context="modal"
            titleId={titleId}
            mode={isLogin ? "login" : "register"}
            onModeChange={changeMode}
            email={email}
            onEmailChange={setEmail}
            password={password}
            onPasswordChange={setPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={handleAuth}
            loading={loading}
            configured={isSupabaseConfigured}
            fieldErrors={fieldErrors}
            formError={errorMsg}
            notice={successMsg}
          />
        </div>
      </div>
    </div>
  );
}
