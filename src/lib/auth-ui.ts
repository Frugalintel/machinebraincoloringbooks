/**
 * Sign in (Studio S3 "One line"): copy, states and validation shared by /auth
 * and AuthModal. Voice: speaks to "you", sentence case, no exclamation marks.
 */
import { normalizeBookCode } from "@/lib/scan-params";

export type AuthMode = "login" | "register";
/** `check` is the "Check your email" state after a sign-up that needs confirming. */
export type AuthView = AuthMode | "check";
export type AuthField = "email" | "password" | "confirmPassword";
/** An empty string marks a field invalid without a message of its own. */
export type AuthFieldErrors = Partial<Record<AuthField, string>>;

export const AUTH_FIELD_ORDER: readonly AuthField[] = [
  "email",
  "password",
  "confirmPassword",
];

/** Supabase's sign-up minimum, enforced client-side by both forms. */
export const AUTH_PASSWORD_MIN_LENGTH = 6;

export const AUTH_DEFAULT_NEXT = "/profile/me";

export type AuthHeadline = {
  /** Picks the fitted size for the line; longer lines set smaller. */
  fit: "in" | "up" | "code" | "check";
  lines: readonly [string, string];
  /** Visually hidden, so screen readers hear the page purpose first. */
  prefix: string | null;
};

export type AuthHoldKind = "code" | "book" | "page-plus";

export type AuthHold = {
  kind: AuthHoldKind;
  label: string;
};

function holdKind(
  hold: boolean | AuthHoldKind | AuthHold | null | undefined,
): AuthHoldKind | null {
  if (hold === true || hold === "code") return "code";
  if (hold === "book" || hold === "page-plus") return hold;
  if (hold && typeof hold === "object") return hold.kind;
  return null;
}

/** The giant Redaction line: the one H1, changing with the state. */
export function authHeadline(
  view: AuthView,
  hold: boolean | AuthHoldKind | AuthHold | null = false,
): AuthHeadline {
  const kind = holdKind(hold);
  switch (view) {
    case "login":
      if (kind === "page-plus") {
        return {
          fit: "code",
          lines: ["Sign in for", "your +1."],
          prefix: "Sign in.",
        };
      }
      if (kind === "book") {
        return {
          fit: "code",
          lines: ["Keep your", "book."],
          prefix: "Sign in.",
        };
      }
      return {
        fit: kind === "code" ? "code" : "in",
        lines: kind === "code" ? ["Keep your", "code."] : ["Welcome", "back."],
        prefix: "Sign in.",
      };
    case "register":
      if (kind === "page-plus") {
        return {
          fit: "code",
          lines: ["Sign in for", "your +1."],
          prefix: "Create an account.",
        };
      }
      if (kind === "book") {
        return {
          fit: "code",
          lines: ["Keep your", "book."],
          prefix: "Create an account.",
        };
      }
      return {
        fit: kind === "code" ? "code" : "up",
        lines:
          kind === "code" ? ["Keep your", "code."] : ["Keep your", "pages."],
        prefix: "Create an account.",
      };
    case "check":
      return { fit: "check", lines: ["Check your", "email."], prefix: null };
    default: {
      const _exhaustive: never = view;
      throw new Error(`Unhandled auth view: ${String(_exhaustive)}`);
    }
  }
}

export type ModeCopy = {
  submit: string;
  submitting: string;
  swapPrompt: string;
  swapAction: string;
  heldAction: string;
};

export function authHoldBody(kind: AuthHoldKind): string | null {
  switch (kind) {
    case "book":
      return AUTH_COPY.holdBookBody;
    case "page-plus":
      return AUTH_COPY.holdPageBody;
    case "code":
      return null;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function authModeCopy(mode: AuthMode): ModeCopy {
  switch (mode) {
    case "login":
      return {
        submit: "Sign in",
        submitting: "Signing in…",
        swapPrompt: "New here?",
        swapAction: "Create an account",
        heldAction: "Sign in to keep it.",
      };
    case "register":
      return {
        submit: "Create account",
        submitting: "Creating account…",
        swapPrompt: "Have an account?",
        swapAction: "Sign in",
        heldAction: "Create an account to keep it.",
      };
    default: {
      const _exhaustive: never = mode;
      throw new Error(`Unhandled auth mode: ${String(_exhaustive)}`);
    }
  }
}

export const AUTH_COPY = {
  runningHead: ["Pl. 00", "Account", "Machine Brain · Sign in"],
  why: "Your account keeps the books you register, your points and what they open.",
  heldLabel: "Code held",
  heldNote:
    "A page code is 1\u00a0pt, or 2\u00a0pts with a scan of your colored page.",
  checkLabel: "Link sent",
  checkText:
    "The link that confirms your account is in your inbox. Open it, then sign in here.",
  checkBack: "Back to sign in",
  errorLabel: "Check this",
  noteLabel: "Note",
  checkFields: "Check the marked fields.",
  emailRequired: "Enter your email.",
  emailInvalid: "That doesn’t look like an email address.",
  passwordRequired: "Enter your password.",
  passwordMismatch: "The two passwords don’t match.",
  passwordTooShort: `Use at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`,
  passwordHint: `At least ${AUTH_PASSWORD_MIN_LENGTH} characters.`,
  notConfigured:
    "Sign in isn’t set up on this site yet, so it may not work right now.",
  accountExists:
    "You already have an account with this email. Enter your password to sign in.",
  invalidLogin: "That email and password don’t match an account.",
  invalidLoginField: "Check it and try again.",
  emailNotConfirmed: "Confirm your email first. The link is in your inbox.",
  genericError: "Something went wrong. Please try again.",
  holdHead: "PL. 00 · Sign in",
  holdBookBody: "Sign in or create an account to add this book and its unlock.",
  holdPageBody: "Sign in or create an account and the point is yours.",
  networkError:
    "Sign in couldn’t reach the server. Check your connection and try again.",
} as const;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

/** Checks every field at once, like Studio's prototype; empty result means valid. */
export function validateAuthForm(
  mode: AuthMode,
  { email, password, confirmPassword }: AuthValues,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const trimmed = email.trim();
  if (!trimmed) errors.email = AUTH_COPY.emailRequired;
  else if (!EMAIL_SHAPE.test(trimmed)) errors.email = AUTH_COPY.emailInvalid;

  if (!password) errors.password = AUTH_COPY.passwordRequired;
  else if (mode === "register" && password.length < AUTH_PASSWORD_MIN_LENGTH) {
    errors.password = AUTH_COPY.passwordTooShort;
  }

  if (mode === "register" && password && confirmPassword !== password) {
    errors.confirmPassword = AUTH_COPY.passwordMismatch;
  }
  return errors;
}

export function hasFieldErrors(errors: AuthFieldErrors): boolean {
  return AUTH_FIELD_ORDER.some((field) => errors[field] !== undefined);
}

export type AuthFailure = { summary: string; fields: AuthFieldErrors };

/** Maps Supabase auth errors onto the brand voice; unknown errors pass through. */
export function authFailure(error: unknown): AuthFailure {
  if (!(error instanceof Error) || !error.message) {
    return { summary: AUTH_COPY.genericError, fields: {} };
  }
  if (error.message.includes("Invalid login")) {
    return {
      summary: AUTH_COPY.invalidLogin,
      fields: { email: "", password: AUTH_COPY.invalidLoginField },
    };
  }
  if (error.message.includes("Email not confirmed")) {
    return { summary: AUTH_COPY.emailNotConfirmed, fields: {} };
  }
  if (/Failed to fetch|NetworkError|Load failed/.test(error.message)) {
    return { summary: AUTH_COPY.networkError, fields: {} };
  }
  return { summary: error.message, fields: {} };
}

export function isAccountExistsError(error: Error): boolean {
  return /already registered|already exists/.test(error.message);
}

const PARSE_BASE = "https://next.invalid";

/**
 * `next=` may only send you somewhere on this site: a relative path with one
 * leading "/". Protocol-relative ("//host"), backslash, scheme and control
 * character forms all fall back to the profile.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || next[0] !== "/" || next[1] === "/") return AUTH_DEFAULT_NEXT;
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return AUTH_DEFAULT_NEXT;
  try {
    const url = new URL(next, PARSE_BASE);
    if (url.origin !== PARSE_BASE) return AUTH_DEFAULT_NEXT;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return AUTH_DEFAULT_NEXT;
  }
}

/** `/scan?mode=code&code=ab12` in a safe `next` holds a page code: "AB12". */
export function codeFromNext(safeNext: string): string | null {
  const url = new URL(safeNext, PARSE_BASE);
  if (url.pathname !== "/scan" || url.searchParams.get("mode") !== "code") {
    return null;
  }
  return normalizeBookCode(url.searchParams.get("code") ?? "") || null;
}

export type AuthEntry = {
  mode: AuthMode;
  email: string;
  next: string;
  code: string | null;
};

/** The live `/auth` params: `mode`, `email` (alone opens register) and `next`. */
export function authEntryFromParams(params: {
  get(name: string): string | null;
}): AuthEntry {
  const modeParam = params.get("mode");
  const email = params.get("email") ?? "";
  const mode: AuthMode =
    modeParam === "register" || (email && !modeParam) ? "register" : "login";
  const next = safeNextPath(params.get("next"));
  return { mode, email, next, code: codeFromNext(next) };
}
