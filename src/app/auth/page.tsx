"use client";

import { useState, useEffect, Suspense, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import {
  AUTH_COPY,
  AUTH_PASSWORD_MIN_LENGTH,
  authErrorMessage,
  type AuthFieldErrors,
  type AuthMode,
} from "@/lib/auth-ui";
import { STORAGE_KEYS } from "@/lib/constants";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/** One plate under the minimal header: a running head, then the panel. */
function AuthPlate({ children }: { children: ReactNode }) {
  return (
    <main
      data-testid="auth-page"
      className="flex min-h-[calc(100svh-4rem)] flex-col bg-background text-cream lg:min-h-[calc(100svh-5rem)]"
    >
      <div className="mx-5 flex items-center justify-between gap-4 border-b border-line py-4 font-label text-fg-muted md:mx-10">
        <span>Account</span>
        <span className="text-right">{AUTH_COPY.runningHead}</span>
      </div>
      <div className="flex flex-1 justify-center px-5 pt-10 pb-16 md:items-center md:py-16">
        {children}
      </div>
    </main>
  );
}

function AuthPageContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/profile/me";

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const modeParam = searchParams.get("mode");

    if (emailParam) {
      setEmail(emailParam);
    }

    if (modeParam === "register") {
      setIsLogin(false);
    } else if (modeParam === "login") {
      setIsLogin(true);
    } else if (emailParam && !modeParam) {
      setIsLogin(false);
    }
  }, [searchParams]);

  const changeMode = (mode: AuthMode) => {
    setIsLogin(mode === "login");
    setFieldErrors({});
    setFormError("");
    setNotice("");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});
    setFormError("");
    setNotice("");

    // Validation for empty fields
    if (!email || !password) {
      setFieldErrors({
        ...(email ? {} : { email: AUTH_COPY.emailRequired }),
        ...(password ? {} : { password: AUTH_COPY.passwordRequired }),
      });
      setLoading(false);
      return;
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      setFormError(AUTH_COPY.notConfigured);
      setLoading(false);
      return;
    }

    // Basic validation for register
    if (!isLogin && password !== confirmPassword) {
      setFieldErrors({ confirmPassword: AUTH_COPY.passwordMismatch });
      setLoading(false);
      return;
    }

    // Password length validation
    if (!isLogin && password.length < AUTH_PASSWORD_MIN_LENGTH) {
      setFieldErrors({ password: AUTH_COPY.passwordTooShort });
      setLoading(false);
      return;
    }

    // Save email as last provider
    localStorage.setItem(STORAGE_KEYS.LAST_PROVIDER, "email");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Refresh router to update server components with new auth state
        router.refresh();
        router.push(nextUrl);
        return;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          if (
            error.message.includes("User already registered") ||
            error.message.includes("already exists")
          ) {
            setIsLogin(true);
            setFormError(AUTH_COPY.accountExists);
            setLoading(false);
            return;
          }
          throw error;
        }
        if (data.user?.email && !data.session) {
          setNotice(AUTH_COPY.confirmEmail);
        } else {
          // Refresh router to update server components with new auth state
          router.refresh();
          router.push(nextUrl);
          return;
        }
      }
    } catch (error: unknown) {
      setFormError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPlate>
      <AuthPanel
        context="page"
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
        formError={formError}
        notice={notice}
      />
    </AuthPlate>
  );
}

function noop() {}

/** Same plate and panel, inert, so hydration swaps in without a layout shift. */
function AuthPageLoading() {
  return (
    <AuthPlate>
      <AuthPanel
        context="page"
        mode="login"
        onModeChange={noop}
        email=""
        onEmailChange={noop}
        password=""
        onPasswordChange={noop}
        confirmPassword=""
        onConfirmPasswordChange={noop}
        onSubmit={(event) => event.preventDefault()}
        disabled
        configured={isSupabaseConfigured}
      />
    </AuthPlate>
  );
}

// Main export wrapped in Suspense for useSearchParams
export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <AuthPageContent />
    </Suspense>
  );
}
