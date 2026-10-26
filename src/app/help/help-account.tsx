"use client";

import Link from "next/link";
import { useOptionalAuth } from "@/context/auth-context";
import { HELP_SIGN_IN_HREF } from "@/lib/help";

export function HelpContactActions() {
  const { user } = useOptionalAuth();

  return (
    <p className="help-acts">
      <Link className="quiet hit-44" href="/orders/lookup">
        Order lookup
      </Link>
      {user ? (
        <Link className="quiet hit-44" href="/profile/me">
          Profile
        </Link>
      ) : (
        <Link className="quiet hit-44" href={HELP_SIGN_IN_HREF}>
          Sign in
        </Link>
      )}
    </p>
  );
}
