/**
 * Shared copy and types for the sign-in visual used by /auth and AuthModal.
 * Voice: speaks to "you", sentence case, no exclamation marks.
 */

export type AuthMode = "login" | "register";
export type AuthField = "email" | "password" | "confirmPassword";
export type AuthFieldErrors = Partial<Record<AuthField, string>>;

/** Supabase's sign-up minimum, enforced client-side by both forms. */
export const AUTH_PASSWORD_MIN_LENGTH = 6;

type ModeCopy = {
  label: string;
  title: string;
  lede: string;
  submit: string;
  submitting: string;
};

export function authModeCopy(mode: AuthMode): ModeCopy {
  switch (mode) {
    case "login":
      return {
        label: "Sign in",
        title: "Welcome back",
        lede: "Sign in to pick up your page codes, points and unlocks.",
        submit: "Sign in",
        submitting: "Signing in…",
      };
    case "register":
      return {
        label: "Create account",
        title: "Create your account",
        lede: "Save your page codes, earn points and spend them on unlocks.",
        submit: "Create account",
        submitting: "Creating account…",
      };
    default: {
      const _exhaustive: never = mode;
      throw new Error(`Unhandled auth mode: ${String(_exhaustive)}`);
    }
  }
}

export const AUTH_COPY = {
  runningHead: "Your codes, points and unlocks",
  emailRequired: "Enter your email.",
  passwordRequired: "Enter your password.",
  passwordMismatch: "These passwords don’t match.",
  passwordTooShort: `Use at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`,
  passwordHint: `At least ${AUTH_PASSWORD_MIN_LENGTH} characters.`,
  notConfigured:
    "Sign in isn’t set up on this site yet, so it may not work right now.",
  accountExists:
    "You already have an account with this email. Enter your password to sign in.",
  invalidLogin: "Your email or password is incorrect.",
  emailNotConfirmed: "Confirm your email first. The link is in your inbox.",
  confirmEmail: "Check your email for the confirmation link.",
  genericError: "Something went wrong. Please try again.",
  networkError:
    "Sign in couldn’t reach the server. Check your connection and try again.",
} as const;

/** Maps Supabase auth errors onto the brand voice; unknown errors pass through. */
export function authErrorMessage(error: unknown): string {
  if (!(error instanceof Error) || !error.message) {
    return AUTH_COPY.genericError;
  }
  if (error.message.includes("Invalid login")) {
    return AUTH_COPY.invalidLogin;
  }
  if (error.message.includes("Email not confirmed")) {
    return AUTH_COPY.emailNotConfirmed;
  }
  if (/Failed to fetch|NetworkError|Load failed/.test(error.message)) {
    return AUTH_COPY.networkError;
  }
  return error.message;
}
