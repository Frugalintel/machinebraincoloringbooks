import { describe, expect, it, vi } from "vitest";
import {
  applyAuthStateChange,
  authTokenCookieNames,
  clearAuthStorage,
  clearAuthTokenCookies,
  clearLocalAuthCopies,
  expireAuthCookie,
  fireLocalLogoutRequest,
  isAuthStorageKey,
  isAuthTokenCookieName,
  isInvalidSessionError,
  shouldApplyHydratedProfile,
  supabaseLocalLogoutUrl,
  validateStoredSession,
} from "@/lib/auth-session";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    getItem(name: string) {
      return data.get(name) ?? null;
    },
    removeItem(name: string) {
      data.delete(name);
    },
    setItem(name: string, value: string) {
      data.set(name, value);
    },
  };
}

describe("isInvalidSessionError", () => {
  it("treats AuthApiError 401/403 as invalid", () => {
    expect(
      isInvalidSessionError({
        name: "AuthApiError",
        status: 401,
        code: "bad_jwt",
      }),
    ).toBe(true);
    expect(
      isInvalidSessionError({
        name: "AuthApiError",
        status: 403,
        code: "session_not_found",
      }),
    ).toBe(true);
  });

  it("keeps the session on retryable, offline, and 5xx errors", () => {
    expect(
      isInvalidSessionError({
        name: "AuthRetryableFetchError",
        status: 0,
        message: "Failed to fetch",
      }),
    ).toBe(false);
    expect(
      isInvalidSessionError({
        name: "AuthApiError",
        status: 503,
        message: "unavailable",
      }),
    ).toBe(false);
    expect(isInvalidSessionError(new TypeError("Failed to fetch"))).toBe(false);
  });
});

describe("validateStoredSession", () => {
  it("treats a cached session as signed out when getUser returns no user", async () => {
    const session = { user: { id: "stale-1" } };
    const getUser = vi.fn(async () => ({
      data: { user: null },
      error: null,
    }));

    await expect(validateStoredSession(session, getUser)).resolves.toEqual({
      status: "invalid",
    });
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it("treats AuthApiError 401/403 as an invalid session", async () => {
    const session = { user: { id: "stale-1" } };
    const getUser = vi.fn(async () => ({
      data: { user: null },
      error: {
        name: "AuthApiError",
        status: 403,
        code: "user_not_found",
        message: "User from sub claim in JWT does not exist",
      },
    }));

    await expect(validateStoredSession(session, getUser)).resolves.toEqual({
      status: "invalid",
    });
  });

  it("keeps a session when getUser is offline or returns 5xx", async () => {
    const session = { user: { id: "user-1" } };
    await expect(
      validateStoredSession(session, async () => ({
        data: { user: null },
        error: {
          name: "AuthRetryableFetchError",
          status: 0,
          message: "Failed to fetch",
        },
      })),
    ).resolves.toEqual({ status: "unknown" });
    await expect(
      validateStoredSession(session, async () => ({
        data: { user: null },
        error: { name: "AuthApiError", status: 503, message: "unavailable" },
      })),
    ).resolves.toEqual({ status: "unknown" });
    await expect(
      validateStoredSession(session, async () => {
        throw new TypeError("Failed to fetch");
      }),
    ).resolves.toEqual({ status: "unknown" });
  });

  it("keeps a session when getUser confirms the user", async () => {
    const session = { user: { id: "user-1" } };
    const user = { id: "user-1", email: "ada@example.com" };
    const getUser = vi.fn(async () => ({
      data: { user },
      error: null,
    }));

    await expect(validateStoredSession(session, getUser)).resolves.toEqual({
      status: "valid",
      session,
      user,
    });
  });

  it("does not call getUser when there is no stored session", async () => {
    const getUser = vi.fn();
    await expect(validateStoredSession(null, getUser)).resolves.toEqual({
      status: "invalid",
    });
    expect(getUser).not.toHaveBeenCalled();
  });
});

describe("fireLocalLogoutRequest", () => {
  it("POSTs logout with the supplied token and does not wait on the response", () => {
    const fetchFn = vi.fn(() => new Promise(() => undefined));
    fireLocalLogoutRequest("old-access", {
      supabaseUrl: "https://proj.supabase.co",
      anonKey: "anon-key",
      fetchFn: fetchFn as typeof fetch,
    });
    expect(fetchFn).toHaveBeenCalledWith(
      supabaseLocalLogoutUrl("https://proj.supabase.co"),
      {
        method: "POST",
        keepalive: true,
        headers: {
          apikey: "anon-key",
          Authorization: "Bearer old-access",
        },
      },
    );
  });

  it("swallows a rejected logout request", async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(() =>
      fireLocalLogoutRequest("old-access", {
        supabaseUrl: "https://proj.supabase.co",
        anonKey: "anon-key",
        fetchFn: fetchFn as typeof fetch,
      }),
    ).not.toThrow();
    await Promise.resolve();
    expect(fetchFn).toHaveBeenCalled();
  });
});

describe("auth token cookies", () => {
  it("matches sb-*-auth-token chunks including numbered suffixes", () => {
    expect(isAuthTokenCookieName("sb-abc123-auth-token")).toBe(true);
    expect(isAuthTokenCookieName("sb-abc123-auth-token.0")).toBe(true);
    expect(isAuthTokenCookieName("sb-abc123-auth-token.1")).toBe(true);
    expect(isAuthTokenCookieName("theme")).toBe(false);
    expect(isAuthTokenCookieName("sb-abc123-other")).toBe(false);
  });

  it("lists leftover auth token chunks from a cookie header", () => {
    expect(
      authTokenCookieNames(
        "theme=dark; sb-xyz-auth-token.0=aaa; sb-xyz-auth-token.1=bbb; other=1",
      ),
    ).toEqual(["sb-xyz-auth-token.0", "sb-xyz-auth-token.1"]);
  });

  it("expires leftover auth token chunks on the document", () => {
    const doc = {
      cookie: "theme=dark; sb-xyz-auth-token=chunk; sb-xyz-auth-token.0=aaa",
    };
    const cleared = clearAuthTokenCookies(doc);
    expect(cleared).toEqual(["sb-xyz-auth-token", "sb-xyz-auth-token.0"]);
    expect(doc.cookie).toContain(expireAuthCookie("sb-xyz-auth-token.0"));
  });

  it("clears matching local and session storage copies of the session", () => {
    const store = memoryStorage({
      theme: "dark",
      "sb-xyz-auth-token": '{"access_token":"x"}',
      "sb-xyz-auth-token.0": "chunk",
    });
    expect(isAuthStorageKey("sb-xyz-auth-token")).toBe(true);
    expect(isAuthStorageKey("theme")).toBe(false);
    expect(clearAuthStorage(store)).toEqual([
      "sb-xyz-auth-token.0",
      "sb-xyz-auth-token",
    ]);
    expect(store.getItem("sb-xyz-auth-token")).toBeNull();
    expect(store.getItem("theme")).toBe("dark");
  });

  it("clears cookies and storage together so a cancelled logout cannot leave a copy", () => {
    const doc = { cookie: "sb-xyz-auth-token=chunk" };
    const localStorage = memoryStorage({ "sb-xyz-auth-token": "{}" });
    const sessionStorage = memoryStorage({ "sb-xyz-auth-token.1": "c" });
    clearLocalAuthCopies({ document: doc, localStorage, sessionStorage });
    expect(doc.cookie).toContain(expireAuthCookie("sb-xyz-auth-token"));
    expect(localStorage.getItem("sb-xyz-auth-token")).toBeNull();
    expect(sessionStorage.getItem("sb-xyz-auth-token.1")).toBeNull();
  });
});

describe("shouldApplyHydratedProfile", () => {
  it("rejects a late profile after sign-out or a user-id mismatch", () => {
    expect(
      shouldApplyHydratedProfile({
        requestedUserId: "user-1",
        currentUserId: "user-1",
        signedOutLocally: true,
      }),
    ).toBe(false);
    expect(
      shouldApplyHydratedProfile({
        requestedUserId: "user-1",
        currentUserId: "user-2",
        signedOutLocally: false,
      }),
    ).toBe(false);
    expect(
      shouldApplyHydratedProfile({
        requestedUserId: "user-1",
        currentUserId: "user-1",
        signedOutLocally: false,
      }),
    ).toBe(true);
  });
});

describe("applyAuthStateChange", () => {
  it("clears state on SIGNED_OUT even if a stale session is attached", () => {
    expect(
      applyAuthStateChange("SIGNED_OUT", { user: { id: "stale" } }),
    ).toEqual({ kind: "signed-out" });
  });

  it("ignores TOKEN_REFRESHED after a local sign-out so a cross-tab refresh cannot rewrite", () => {
    expect(
      applyAuthStateChange(
        "TOKEN_REFRESHED",
        { user: { id: "stale" } },
        { signedOutLocally: true },
      ),
    ).toEqual({ kind: "ignore" });
    expect(
      applyAuthStateChange(
        "INITIAL_SESSION",
        { user: { id: "stale" } },
        {
          signedOutLocally: true,
        },
      ),
    ).toEqual({ kind: "ignore" });
  });

  it("applies a real SIGNED_IN after a local sign-out", () => {
    const session = { user: { id: "user-2" } };
    expect(
      applyAuthStateChange("SIGNED_IN", session, { signedOutLocally: true }),
    ).toEqual({ kind: "signed-in", session });
  });

  it("ignores INITIAL_SESSION while init is still validating", () => {
    expect(
      applyAuthStateChange(
        "INITIAL_SESSION",
        { user: { id: "stale" } },
        { initPending: true },
      ),
    ).toEqual({ kind: "ignore" });
    const session = { user: { id: "user-1" } };
    expect(
      applyAuthStateChange("SIGNED_IN", session, { initPending: true }),
    ).toEqual({ kind: "signed-in", session });
  });
});
