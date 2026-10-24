"use client";

import { useState, type FormEvent } from "react";
import {
  AUTH_COPY,
  authFailure,
  hasFieldErrors,
  isAccountExistsError,
  validateAuthForm,
  type AuthField,
  type AuthFieldErrors,
  type AuthMode,
  type AuthValues,
  type AuthView,
} from "@/lib/auth-ui";

/** What a Supabase attempt ended in; `done` means the caller already moved on. */
export type AuthAttemptResult =
  | { kind: "done" }
  | { kind: "check" }
  | { kind: "error"; error: Error };

export type AuthAttempt = (
  mode: AuthMode,
  email: string,
  password: string,
) => Promise<AuthAttemptResult>;

/**
 * Form state, validation and error mapping shared by /auth and AuthModal.
 * Each caller passes its own Supabase attempt, so its calls stay its own.
 */
export function useAuthForm({
  initialMode,
  initialEmail = "",
  configured,
}: {
  initialMode: AuthMode;
  initialEmail?: string;
  configured: boolean;
}) {
  const [view, setView] = useState<AuthView>(initialMode);
  const [values, setValues] = useState<AuthValues>({
    email: initialEmail,
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState("");

  const clearErrors = () => {
    setFieldErrors({});
    setFormError("");
  };

  const reset = (mode: AuthMode, email?: string) => {
    setView(mode);
    setValues((current) => ({
      email: email ?? current.email,
      password: "",
      confirmPassword: "",
    }));
    clearErrors();
    setLoading(false);
  };

  const changeMode = (mode: AuthMode) => {
    setView(mode);
    clearErrors();
  };

  const setValue = (field: AuthField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const submitWith =
    (attempt: AuthAttempt) => async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (loading || view === "check") return;
      const mode = view;

      const errors = validateAuthForm(mode, values);
      if (hasFieldErrors(errors)) {
        setFieldErrors(errors);
        setFormError(AUTH_COPY.checkFields);
        return;
      }
      clearErrors();
      if (!configured) {
        setFormError(AUTH_COPY.notConfigured);
        return;
      }

      setLoading(true);
      try {
        const result = await attempt(mode, values.email, values.password);
        switch (result.kind) {
          case "done":
            return;
          case "check":
            setView("check");
            return;
          case "error": {
            if (mode === "register" && isAccountExistsError(result.error)) {
              setView("login");
              setFormError(AUTH_COPY.accountExists);
              return;
            }
            const failure = authFailure(result.error);
            setFieldErrors(failure.fields);
            setFormError(failure.summary);
            return;
          }
          default: {
            const _exhaustive: never = result;
            throw new Error(`Unhandled auth result: ${String(_exhaustive)}`);
          }
        }
      } catch (error: unknown) {
        setFormError(authFailure(error).summary);
      } finally {
        setLoading(false);
      }
    };

  return {
    view,
    values,
    setValue,
    loading,
    fieldErrors,
    formError,
    changeMode,
    reset,
    submitWith,
  };
}
