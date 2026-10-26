import { describe, expect, it, vi } from "vitest";
import {
  applyAuthStateChange,
  authTokenCookieNames,
  clearAuthStorage,
  clearAuthTokenCookies,
  clearLocalAuthCopies,
  expireAuthCookie,
  isAuthStorageKey,
  isAuthTokenCookieName,
  shouldApplyHydratedProfile,
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

describe("validateStoredSession", () => {
  it("treats a cached session as signed out when getUser returns no user", async () => {
    const session = { user: { id: "stale-1" } };
    const getUser = vi.fn(async () => ({
      data: { user: null },
      error: null,
    }));

    await expect(validateStoredSession(session, getUser)).resolves.toEqual({
      ok: false,
    });
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it("treats a cached session as signed out when getUser errors", async () => {
    const session = { user: { id: "stale-1" } };
    const getUser = vi.fn(async () => ({
      data: { user: null },
      error: { message: "Auth session missing!" },
    }));

    await expect(validateStoredSession(session, getUser)).resolves.toEqual({
      ok: false,
    });
  });

  it("keeps a session when getUser confirms the user", async () => {
    const session = { user: { id: "user-1" } };
    const user = { id: "user-1", email: "ada@example.com" };
    const getUser = vi.fn(async () => ({
      data: { user },
      error: null,
    }));

    await expect(validateStoredSession(session, getUser)).resolves.toEqual({
      ok: true,
      session,
      user,
    });
  });

  it("does not call getUser when there is no stored session", async () => {
    const getUser = vi.fn();
    await expect(validateStoredSession(null, getUser)).resolves.toEqual({
      ok: false,
    });
    expect(getUser).not.toHaveBeenCalled();
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
});
