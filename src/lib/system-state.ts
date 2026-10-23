/**
 * Shared copy and actions for branded system states (404, error, loading).
 * Verbal voice: curious, quiet, precise. Speak to "you". No exclamation marks.
 */

export type SystemStateKind = "notFound" | "error";

export type SystemStateAction = {
  name: string;
  href: string;
  variant: "primary" | "secondary";
};

export type SystemStateCopy = {
  code: string;
  title: string;
  body: string;
};

export const SYSTEM_STATE_ACTIONS: readonly SystemStateAction[] = [
  { name: "Home", href: "/", variant: "primary" },
  { name: "Store", href: "/store", variant: "secondary" },
  { name: "Sign in", href: "/auth?mode=login", variant: "secondary" },
];

const COPY: Record<SystemStateKind, SystemStateCopy> = {
  notFound: {
    code: "Error 404",
    title: "Page not found",
    body: "This address is not in the catalog. Look closer on the store, or return home.",
  },
  error: {
    code: "Error",
    title: "Something went wrong",
    body: "This page could not finish loading. Try again, or go back to a known route.",
  },
};

export function systemStateCopy(kind: SystemStateKind): SystemStateCopy {
  switch (kind) {
    case "notFound":
    case "error":
      return COPY[kind];
    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unhandled system state: ${String(_exhaustive)}`);
    }
  }
}

export const SYSTEM_STATE_MARK_SIZE_PX = 64;
