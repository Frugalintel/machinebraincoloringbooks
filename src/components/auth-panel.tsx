"use client";

import "./auth-panel.css";
import {
  useEffect,
  useId,
  useRef,
  type FormEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  AUTH_COPY,
  AUTH_FIELD_ORDER,
  authHeadline,
  authModeCopy,
  type AuthField,
  type AuthFieldErrors,
  type AuthMode,
  type AuthValues,
  type AuthView,
} from "@/lib/auth-ui";

/** `page` sets the one H1; `modal` sits over a page that already has one. */
export type AuthPanelContext = "page" | "modal";

export type AuthPanelProps = {
  context: AuthPanelContext;
  view: AuthView;
  /** A page code carried in from /scan: shows the "Keep your / code." state. */
  code?: string | null;
  onModeChange: (mode: AuthMode) => void;
  values: AuthValues;
  onValueChange: (field: AuthField, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  /** Renders every control inert, e.g. the Suspense fallback before hydration. */
  disabled?: boolean;
  configured?: boolean;
  fieldErrors?: AuthFieldErrors;
  formError?: string;
  headingId?: string;
  /** Modal only: the lockup and Close row, drawn where the site nav sits. */
  top?: ReactNode;
};

function describedBy(
  ...ids: (string | false | undefined)[]
): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

type FieldProps = {
  id: string;
  name: string;
  label: string;
  type: "email" | "password";
  autoComplete: "email" | "current-password" | "new-password";
  value: string;
  onChange: (value: string) => void;
  error: string | undefined;
  hint?: string;
  inputRef: Ref<HTMLInputElement>;
  readOnly: boolean;
  disabled: boolean;
};

function Field({
  id,
  name,
  label,
  type,
  autoComplete,
  value,
  onChange,
  error,
  hint,
  inputRef,
  readOnly,
  disabled,
}: FieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const message = error || null;

  return (
    <div className="sa-fld">
      <label className="sa-label sa-mono" htmlFor={id}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type={type}
        className="sa-input"
        autoComplete={autoComplete}
        inputMode={type === "email" ? "email" : undefined}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        disabled={disabled}
        aria-invalid={error !== undefined ? true : undefined}
        aria-describedby={describedBy(
          hint ? hintId : undefined,
          message ? errorId : undefined,
        )}
      />
      {hint ? (
        <p id={hintId} className="sa-hint">
          {hint}
        </p>
      ) : null}
      {message ? (
        <p id={errorId} className="sa-msg">
          <b>{AUTH_COPY.errorLabel}</b>
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  );
}

/**
 * The one sign-in plate shared by /auth and AuthModal. Presentational only:
 * the parent owns form state, validation and every Supabase call.
 */
export function AuthPanel({
  context,
  view,
  code = null,
  onModeChange,
  values,
  onValueChange,
  onSubmit,
  loading = false,
  disabled = false,
  configured = true,
  fieldErrors = {},
  formError = "",
  headingId,
  top,
}: AuthPanelProps) {
  const uid = useId();
  const ids = {
    heading: headingId ?? `${uid}-heading`,
    email: `${uid}-email`,
    password: `${uid}-password`,
    confirm: `${uid}-confirm`,
  };
  const mode: AuthMode = view === "login" ? "login" : "register";
  const copy = authModeCopy(mode);
  const headline = authHeadline(view, Boolean(code));
  const isRegister = mode === "register";
  const Heading = context === "page" ? "h1" : "h2";

  const headingRef = useRef<HTMLHeadingElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const shownView = useRef(view);

  useEffect(() => {
    if (shownView.current === view) return;
    shownView.current = view;
    headingRef.current?.focus();
  }, [view]);

  useEffect(() => {
    const inputs: Record<AuthField, HTMLInputElement | null> = {
      email: emailRef.current,
      password: passwordRef.current,
      confirmPassword: confirmRef.current,
    };
    const marked = AUTH_FIELD_ORDER.filter(
      (field) => fieldErrors[field] !== undefined,
    );
    const first = marked.find((field) => fieldErrors[field]) ?? marked[0];
    if (first) inputs[first]?.focus();
  }, [fieldErrors]);

  const swap = () => onModeChange(isRegister ? "login" : "register");

  return (
    <section
      className="sa"
      data-auth-context={context}
      data-view={view}
      aria-labelledby={ids.heading}
    >
      {top}
      <div className="sa-rh sa-mono" aria-hidden="true">
        {AUTH_COPY.runningHead.map((part) => (
          <span key={part}>{part}</span>
        ))}
      </div>

      <Heading
        ref={headingRef}
        id={ids.heading}
        tabIndex={-1}
        className="font-display sa-h1"
      >
        {headline.prefix ? (
          <span className="sa-vh">{`${headline.prefix} `}</span>
        ) : null}
        <span className="sa-lines" data-fit={headline.fit}>
          <span className="sa-l">{headline.lines[0]}</span>{" "}
          <span className="sa-l">{headline.lines[1]}</span>
        </span>
      </Heading>

      <div className="sa-band">
        <div className="sa-side">
          {view === "check" ? null : code ? (
            <div className="sa-held" data-testid="auth-held">
              <span className="sa-mono sa-signal">{AUTH_COPY.heldLabel}</span>
              <span className="sa-code" data-testid="auth-code">
                {code}
              </span>
              <p className="sa-held-text">
                {copy.heldAction} {AUTH_COPY.heldNote}
              </p>
            </div>
          ) : (
            <p className="sa-why">{AUTH_COPY.why}</p>
          )}
        </div>

        <div className="sa-main">
          {view === "check" ? (
            <div role="status" data-testid="auth-check">
              <p className="sa-mono sa-signal">{AUTH_COPY.checkLabel}</p>
              <p className="sa-check-text">{AUTH_COPY.checkText}</p>
              <button
                type="button"
                className="sa-quiet"
                onClick={() => onModeChange("login")}
              >
                {AUTH_COPY.checkBack}
              </button>
            </div>
          ) : (
            <form
              method="post"
              noValidate
              onSubmit={onSubmit}
              aria-label="Account"
              aria-busy={loading || undefined}
            >
              <div role="alert">
                {formError ? (
                  <div className="sa-sum" data-testid="auth-summary">
                    <b>{AUTH_COPY.errorLabel}</b>
                    <span>{formError}</span>
                  </div>
                ) : null}
              </div>
              {configured ? null : (
                <p role="status" className="sa-sum" data-tone="note">
                  <b>{AUTH_COPY.noteLabel}</b>
                  <span>{AUTH_COPY.notConfigured}</span>
                </p>
              )}
              <div className="sa-fields" data-mode={mode}>
                <Field
                  inputRef={emailRef}
                  id={ids.email}
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(value) => onValueChange("email", value)}
                  error={fieldErrors.email}
                  readOnly={loading}
                  disabled={disabled}
                />
                <Field
                  inputRef={passwordRef}
                  id={ids.password}
                  name="password"
                  label="Password"
                  type="password"
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  value={values.password}
                  onChange={(value) => onValueChange("password", value)}
                  error={fieldErrors.password}
                  hint={isRegister ? AUTH_COPY.passwordHint : undefined}
                  readOnly={loading}
                  disabled={disabled}
                />
                {isRegister ? (
                  <Field
                    inputRef={confirmRef}
                    id={ids.confirm}
                    name="confirm-password"
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChange={(value) =>
                      onValueChange("confirmPassword", value)
                    }
                    error={fieldErrors.confirmPassword}
                    readOnly={loading}
                    disabled={disabled}
                  />
                ) : null}
                <div className="sa-go">
                  <button
                    type="submit"
                    className="sa-btn"
                    disabled={disabled}
                    aria-disabled={loading || undefined}
                  >
                    {copy.submit}
                    <span aria-hidden="true" className="sa-arrow">
                      {loading ? "…" : "→"}
                    </span>
                  </button>
                  <span role="status" className="sa-vh">
                    {loading ? copy.submitting : ""}
                  </span>
                </div>
              </div>
              <p className="sa-swap">
                {copy.swapPrompt}{" "}
                <button
                  type="button"
                  className="sa-link"
                  onClick={swap}
                  disabled={disabled || loading}
                >
                  {copy.swapAction}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      <p className="sa-folio sa-mono" aria-hidden="true">
        <span className="sa-signal">●</span>&nbsp; 00
      </p>
    </section>
  );
}
