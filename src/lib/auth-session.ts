export type StoredSession = { user?: unknown } | null;

export type GetUserResult<U> = {
  data: { user: U | null } | null;
  error: unknown;
};

export type ValidatedSession<S, U> =
  | { ok: true; session: S; user: U }
  | { ok: false };

export async function validateStoredSession<S extends { user?: unknown }, U>(
  session: S | null,
  getUser: () => Promise<GetUserResult<U>>,
): Promise<ValidatedSession<S, U>> {
  if (!session?.user) return { ok: false };
  try {
    const { data, error } = await getUser();
    if (error || !data?.user) return { ok: false };
    return { ok: true, session, user: data.user };
  } catch {
    return { ok: false };
  }
}

/** Cookie chunks written by supabase-js / @supabase/ssr. */
export function isAuthTokenCookieName(name: string): boolean {
  return /^sb-[^=]+-auth-token(?:\.\d+)?$/.test(name);
}

export function authTokenCookieNames(cookieHeader: string): string[] {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(";")
    .map((part) => part.trim().split("=")[0] ?? "")
    .filter(isAuthTokenCookieName);
}

export function expireAuthCookie(name: string): string {
  return `${name}=; Max-Age=0; path=/`;
}

export function clearAuthTokenCookies(documentLike: {
  cookie: string;
}): string[] {
  const names = authTokenCookieNames(documentLike.cookie);
  for (const name of names) {
    documentLike.cookie = expireAuthCookie(name);
  }
  return names;
}

export type AuthStateDecision =
  | { kind: "signed-out" }
  | { kind: "signed-in"; session: { user?: unknown } }
  | { kind: "ignore" };

/**
 * SIGNED_OUT always wins, including when a stale session is still attached.
 * After a local sign-out, TOKEN_REFRESHED / INITIAL_SESSION from another tab
 * must not put the previous account back in chrome.
 */
export function applyAuthStateChange(
  event: string,
  session: { user?: unknown } | null,
  options: { signedOutLocally?: boolean } = {},
): AuthStateDecision {
  if (event === "SIGNED_OUT") return { kind: "signed-out" };
  if (options.signedOutLocally && event !== "SIGNED_IN") {
    return { kind: "ignore" };
  }
  if (session?.user) return { kind: "signed-in", session };
  return { kind: "signed-out" };
}
