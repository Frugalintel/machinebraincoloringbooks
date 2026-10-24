"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type Ref,
} from "react";
import { AlertCircle, CircleCheck, Eye, EyeOff, Info } from "lucide-react";
import { BrandLockup } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AUTH_COPY,
  authModeCopy,
  type AuthField,
  type AuthFieldErrors,
  type AuthMode,
} from "@/lib/auth-ui";
import { FOCUS_RING } from "@/lib/ui-brand";
import { cn } from "@/lib/utils";

/** `page` sets the one Redaction H1; `modal` sits over a page that already has one. */
export type AuthPanelContext = "page" | "modal";

export type AuthPanelProps = {
  context: AuthPanelContext;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  /** Renders every control inert, e.g. the Suspense fallback before hydration. */
  disabled?: boolean;
  configured?: boolean;
  fieldErrors?: AuthFieldErrors;
  formError?: string;
  notice?: string;
  titleId?: string;
};

const FIELD_ORDER: readonly AuthField[] = [
  "email",
  "password",
  "confirmPassword",
];

const INPUT_CLASS =
  "h-12 px-4 text-base aria-invalid:border-cream aria-invalid:shadow-[0_0_0_1px_var(--cream)] aria-invalid:focus-visible:shadow-[0_0_0_2px_var(--base),0_0_0_4px_var(--cream)]";

function describedBy(
  ...ids: (string | false | undefined)[]
): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

function FieldMessage({ id, error }: { id: string; error: string }) {
  return (
    <p
      id={id}
      className="flex items-start gap-2 text-base font-medium text-cream"
    >
      <AlertCircle
        aria-hidden="true"
        className="mt-1 size-4 shrink-0"
        strokeWidth={2}
      />
      <span>{error}</span>
    </p>
  );
}

function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  error,
  hint,
  inputRef,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string;
  hint?: string;
  inputRef: Ref<HTMLInputElement>;
}) {
  const [visible, setVisible] = useState(false);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-fg-secondary">
        {label}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hint && hintId, error && errorId)}
          className={cn(INPUT_CLASS, "pr-12")}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={`Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          aria-controls={id}
          className={cn(
            "absolute inset-y-0 right-0 flex w-12 items-center justify-center text-fg-secondary transition-colors hover:text-cream",
            FOCUS_RING,
          )}
        >
          <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      </div>
      {hint ? (
        <p id={hintId} className="text-base text-fg-muted">
          {hint}
        </p>
      ) : null}
      {error ? <FieldMessage id={errorId} error={error} /> : null}
    </div>
  );
}

function ModeSwitch({
  mode,
  onModeChange,
  formId,
  disabled,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  formId: string;
  disabled: boolean;
}) {
  const modes: readonly AuthMode[] = ["login", "register"];
  return (
    <div
      role="group"
      aria-label="Sign in or create an account"
      className="grid grid-cols-2 border-b border-line"
    >
      {modes.map((option) => {
        const active = option === mode;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            aria-controls={formId}
            disabled={disabled}
            onClick={() => onModeChange(option)}
            className={cn(
              "h-12 text-base font-medium transition-colors",
              active
                ? "text-cream shadow-[inset_0_-2px_0_var(--cream)]"
                : "text-fg-muted hover:text-cream",
              FOCUS_RING,
            )}
          >
            {authModeCopy(option).label}
          </button>
        );
      })}
    </div>
  );
}

function Banner({
  tone,
  id,
  children,
}: {
  tone: "error" | "success" | "info";
  id?: string;
  children: string;
}) {
  const Icon =
    tone === "error" ? AlertCircle : tone === "success" ? CircleCheck : Info;
  return (
    <div
      id={id}
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 border px-4 py-3 text-base",
        tone === "error"
          ? "border-cream text-cream"
          : "border-line-strong text-fg-secondary",
      )}
    >
      <Icon
        aria-hidden="true"
        className="mt-1 size-4 shrink-0"
        strokeWidth={2}
      />
      <span>{children}</span>
    </div>
  );
}

/**
 * The one sign-in visual shared by /auth and AuthModal. Presentational only:
 * the parent owns form state, validation and every Supabase call.
 */
export function AuthPanel({
  context,
  mode,
  onModeChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  onSubmit,
  loading = false,
  disabled = false,
  configured = true,
  fieldErrors = {},
  formError = "",
  notice = "",
  titleId,
}: AuthPanelProps) {
  const uid = useId();
  const ids = {
    form: `${uid}-form`,
    title: titleId ?? `${uid}-title`,
    formError: `${uid}-form-error`,
    email: `${uid}-email`,
    password: `${uid}-password`,
    confirm: `${uid}-confirm`,
  };
  const copy = authModeCopy(mode);
  const isRegister = mode === "register";

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const inputs: Record<AuthField, HTMLInputElement | null> = {
      email: emailRef.current,
      password: passwordRef.current,
      confirmPassword: confirmRef.current,
    };
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (first) inputs[first]?.focus();
  }, [fieldErrors]);

  const titleClass = "mt-3 text-balance text-cream";

  return (
    <div className="w-full max-w-[400px]" data-auth-context={context}>
      <header className="flex flex-col items-center text-center">
        <BrandLockup
          layout="stacked"
          markSize={context === "page" ? 64 : 48}
          ink="cream"
          href={null}
          wordmarkClassName="text-base"
        />
        <p
          className="mt-8 font-label tracking-[0.12em] text-signal"
          data-testid="auth-label"
        >
          {copy.label}
        </p>
        {context === "page" ? (
          <h1
            id={ids.title}
            className={cn(
              "font-display text-[40px] md:text-[48px]",
              titleClass,
            )}
          >
            {copy.title}
          </h1>
        ) : (
          <h2
            id={ids.title}
            className={cn(
              "font-heading text-[28px] leading-tight font-bold tracking-[-0.01em]",
              titleClass,
            )}
          >
            {copy.title}
          </h2>
        )}
        <p className="mt-3 max-w-[34ch] text-base text-pretty text-fg-secondary">
          {copy.lede}
        </p>
      </header>

      <div className="mt-8">
        <ModeSwitch
          mode={mode}
          onModeChange={onModeChange}
          formId={ids.form}
          disabled={disabled || loading}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 empty:hidden">
        {configured ? null : (
          <Banner tone="info">{AUTH_COPY.notConfigured}</Banner>
        )}
        {formError ? (
          <Banner tone="error" id={ids.formError}>
            {formError}
          </Banner>
        ) : null}
        {notice ? <Banner tone="success">{notice}</Banner> : null}
      </div>

      <form
        id={ids.form}
        method="post"
        noValidate
        onSubmit={onSubmit}
        aria-labelledby={ids.title}
        aria-describedby={formError ? ids.formError : undefined}
        className="mt-6 flex flex-col gap-6"
      >
        <fieldset
          disabled={loading || disabled}
          className="flex min-w-0 flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={ids.email} className="text-fg-secondary">
              Email
            </Label>
            <Input
              ref={emailRef}
              id={ids.email}
              name="email"
              type="email"
              inputMode="email"
              autoComplete={isRegister ? "email" : "username"}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="you@example.com"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={describedBy(
                fieldErrors.email && `${ids.email}-error`,
              )}
              className={INPUT_CLASS}
            />
            {fieldErrors.email ? (
              <FieldMessage
                id={`${ids.email}-error`}
                error={fieldErrors.email}
              />
            ) : null}
          </div>

          <PasswordField
            inputRef={passwordRef}
            id={ids.password}
            name="password"
            label="Password"
            value={password}
            onChange={onPasswordChange}
            autoComplete={isRegister ? "new-password" : "current-password"}
            hint={isRegister ? AUTH_COPY.passwordHint : undefined}
            error={fieldErrors.password}
          />

          {isRegister ? (
            <PasswordField
              inputRef={confirmRef}
              id={ids.confirm}
              name="confirm-password"
              label="Confirm password"
              value={confirmPassword}
              onChange={onConfirmPasswordChange}
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
            />
          ) : null}
        </fieldset>

        <Button
          type="submit"
          size="lg"
          loading={loading}
          disabled={disabled}
          className="h-12 w-full text-base"
        >
          {loading ? copy.submitting : copy.submit}
        </Button>
      </form>
    </div>
  );
}
