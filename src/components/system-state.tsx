"use client";

import Link from "next/link";
import { BrandLockup, Mark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { useOptionalAuth } from "@/context/auth-context";
import {
  SYSTEM_STATE_ACTIONS,
  SYSTEM_STATE_MARK_SIZE_PX,
  systemStateCopy,
  type SystemStateAction,
  type SystemStateKind,
} from "@/lib/system-state";
import { cn } from "@/lib/utils";

export type SystemStateProps = {
  kind: SystemStateKind;
  reset?: () => void;
  /** When true, render a lockup (root layout is not present). */
  standalone?: boolean;
  className?: string;
};

function SystemMark({ standalone }: { standalone: boolean }) {
  if (standalone) {
    return (
      <BrandLockup
        layout="stacked"
        markSize={SYSTEM_STATE_MARK_SIZE_PX}
        ink="cream"
        headingLevel="span"
      />
    );
  }

  return <Mark size={SYSTEM_STATE_MARK_SIZE_PX} ink="cream" decorative />;
}

function systemActions(
  signedIn: boolean,
  loading: boolean,
): readonly SystemStateAction[] {
  if (loading) {
    return SYSTEM_STATE_ACTIONS.filter((action) => action.name !== "Sign in");
  }
  if (!signedIn) return SYSTEM_STATE_ACTIONS;
  return SYSTEM_STATE_ACTIONS.map((action) =>
    action.name === "Sign in"
      ? { ...action, name: "Account", href: "/profile/me" }
      : action,
  );
}

export function SystemState({
  kind,
  reset,
  standalone = false,
  className,
}: SystemStateProps) {
  const copy = systemStateCopy(kind);
  const { user, isLoading } = useOptionalAuth();
  const actions = systemActions(Boolean(user), isLoading);

  return (
    <main
      id="main"
      className={cn(
        "flex min-h-[calc(100vh-10rem)] flex-col bg-background text-cream",
        standalone && "min-h-screen",
        className,
      )}
    >
      <div className="container mx-auto flex flex-1 flex-col items-start justify-center px-4 py-16 md:px-6 md:py-24">
        <div className="flex w-full min-w-0 max-w-xl flex-col items-start gap-6">
          <SystemMark standalone={standalone} />
          <p className="font-label tracking-[0.12em] text-signal">
            {copy.code}
          </p>
          <h1 className="font-display text-title min-w-0 max-w-full break-words text-cream">
            {copy.title}
          </h1>
          <p className="max-w-md min-w-0 break-words text-base leading-relaxed text-fg-secondary">
            {copy.body}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {kind === "error" && reset ? (
              <Button type="button" onClick={reset}>
                Try again
              </Button>
            ) : null}
            {actions.map((action) => {
              const variant =
                kind === "error" && action.variant === "primary"
                  ? "secondary"
                  : action.variant;
              return (
                <Button
                  key={action.href}
                  variant={variant}
                  className="hit-44"
                  asChild
                >
                  <Link href={action.href}>{action.name}</Link>
                </Button>
              );
            })}
            {isLoading ? (
              <span
                className="invisible inline-flex min-h-11 items-center px-4"
                aria-hidden="true"
              >
                Sign in
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
