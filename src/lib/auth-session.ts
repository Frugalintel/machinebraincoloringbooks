export type StoredSession = { user?: unknown } | null;

export type GetUserResult<U> = {
  data: { user: U | null } | null;
  error: unknown;
};

export type ValidatedSession<S, U> =
  | { status: "valid"; session: S; user: U }
  | { status: "invalid" }
  | { status: "unknown" };

const INVALID_SESSION_CODES = new Set([
  "bad_jwt",
  "session_not_found",
  "user_not_found",
]);

export function isInvalidSessionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  if (name === "AuthRetryableFetchError") return false;
  const status = "status" in error ? Number(error.status) : NaN;
  if (Number.isFinite(status) && status >= 500) return false;
  const code = "code" in error ? String(error.code) : "";
  if (name === "AuthApiError" && (status === 401 || status === 403)) {
    return true;
  }
  return (status === 401 || status === 403) && INVALID_SESSION_CODES.has(code);
}

export async function validateStoredSession<S extends { user?: unknown }, U>(
  session: S | null,
  getUser: () => Promise<GetUserResult<U>>,
): Promise<ValidatedSession<S, U>> {
  if (!session?.user) return { status: "invalid" };
  try {
    const { data, error } = await getUser();
    if (data?.user && !error) {
      return { status: "valid", session, user: data.user };
    }
    if (isInvalidSessionError(error)) return { status: "invalid" };
    if (!error && !data?.user) return { status: "invalid" };
    return { status: "unknown" };
  } catch (error) {
    if (isInvalidSessionError(error)) return { status: "invalid" };
    return { status: "unknown" };
  }
}

export function supabaseLocalLogoutUrl(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/$/, "")}/auth/v1/logout?scope=local`;
}

/** Fire-and-forget revoke. Never log the token. */
export function fireLocalLogoutRequest(
  accessToken: string | null | undefined,
  options: {
    supabaseUrl: string;
    anonKey: string;
    fetchFn?: typeof fetch;
  },
): void {
  if (!accessToken || !options.supabaseUrl || !options.anonKey) return;
  const fetchFn = options.fetchFn ?? fetch;
  void fetchFn(supabaseLocalLogoutUrl(options.supabaseUrl), {
    method: "POST",
    keepalive: true,
    headers: {
      apikey: options.anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  }).catch(() => undefined);
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

export function isAuthStorageKey(name: string): boolean {
  return name.startsWith("sb-") && name.includes("-auth-token");
}

export function clearAuthStorage(
  storage: Pick<Storage, "length" | "key" | "removeItem">,
): string[] {
  const names: string[] = [];
  for (let i = storage.length - 1; i >= 0; i -= 1) {
    const name = storage.key(i);
    if (name && isAuthStorageKey(name)) {
      names.push(name);
      storage.removeItem(name);
    }
  }
  return names;
}

/** Cookies plus any local/session copy. */
export function clearLocalAuthCopies(targets: {
  document?: { cookie: string };
  localStorage?: Pick<Storage, "length" | "key" | "removeItem"> | null;
  sessionStorage?: Pick<Storage, "length" | "key" | "removeItem"> | null;
}): void {
  if (targets.document) clearAuthTokenCookies(targets.document);
  if (targets.localStorage) clearAuthStorage(targets.localStorage);
  if (targets.sessionStorage) clearAuthStorage(targets.sessionStorage);
}

export function shouldApplyHydratedProfile(input: {
  requestedUserId: string;
  currentUserId: string | null;
  signedOutLocally: boolean;
}): boolean {
  if (input.signedOutLocally) return false;
  return input.currentUserId === input.requestedUserId;
}

export type AuthStateDecision =
  | { kind: "signed-out" }
  | { kind: "signed-in"; session: { user?: unknown } }
  | { kind: "ignore" };

/**
 * SIGNED_OUT always wins, including when a stale session is still attached.
 * After a local sign-out, TOKEN_REFRESHED / INITIAL_SESSION from another tab
 * must not put the previous account back in chrome.
 * During init, INITIAL_SESSION must not paint before getUser() finishes.
 */
export function applyAuthStateChange(
  event: string,
  session: { user?: unknown } | null,
  options: { signedOutLocally?: boolean; initPending?: boolean } = {},
): AuthStateDecision {
  if (event === "SIGNED_OUT") return { kind: "signed-out" };
  if (options.initPending && event !== "SIGNED_IN") {
    return { kind: "ignore" };
  }
  if (options.signedOutLocally && event !== "SIGNED_IN") {
    return { kind: "ignore" };
  }
  if (session?.user) return { kind: "signed-in", session };
  return { kind: "signed-out" };
}
