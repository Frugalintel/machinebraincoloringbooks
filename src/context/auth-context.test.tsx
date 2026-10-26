import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider, useAuth } from "@/context/auth-context";
import {
  authTokenCookieNames,
  supabaseLocalLogoutUrl,
} from "@/lib/auth-session";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from "@/lib/supabase";

/**
 * Mirrors supabase-js 2.84: `_notifyAllSubscribers` runs inside the auth
 * lock, awaits an async callback, and any `from()` / `getSession` call
 * while that lock is held never returns (auth-js#762).
 */
let lockHeld = false;
let listener: ((event: string, session: Session | null) => unknown) | undefined;

const TEST_EMAIL = "ada@example.com";
const TEST_PASSWORD = "secret1";

function neverResolves<T>(): Promise<T> {
  return new Promise(() => undefined);
}

function sessionFor(email: string, accessToken = "test-access"): Session {
  return {
    access_token: accessToken,
    refresh_token: "test-refresh",
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: "user-1",
      email,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00.000Z",
    },
  } as Session;
}

async function notify(event: string, session: Session | null): Promise<void> {
  lockHeld = true;
  try {
    const result = listener?.(event, session);
    if (result && typeof (result as Promise<unknown>).then === "function") {
      await result;
    }
  } finally {
    lockHeld = false;
  }
}

async function expectResolves<T>(
  promise: Promise<T>,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const hung = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} hung (auth lock deadlock)`));
    }, 200);
  });
  try {
    return await Promise.race([promise, hung]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function AuthProbe() {
  const { user, isLoading, signIn, signOut } = useAuth();
  return (
    <header>
      <span data-testid="auth-loading">{isLoading ? "loading" : "ready"}</span>
      <span data-testid="auth-user">{user?.email ?? "guest"}</span>
      <span data-testid="auth-name">{user?.displayName ?? ""}</span>
      {user ? (
        <span data-testid="auth-account">{user.email}</span>
      ) : (
        <a href="/auth?mode=login">Sign in</a>
      )}
      <button
        type="button"
        onClick={() => {
          void signIn(TEST_EMAIL, TEST_PASSWORD);
        }}
      >
        Sign in form
      </button>
      <button
        type="button"
        onClick={() => {
          void signOut();
        }}
      >
        Sign out
      </button>
    </header>
  );
}

function SignInHarness({
  onResult,
}: {
  onResult: (result: { error: Error | null }) => void;
}) {
  const { signIn, isLoading } = useAuth();
  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={() => {
        void signIn(TEST_EMAIL, TEST_PASSWORD).then(onResult);
      }}
    >
      Sign in
    </button>
  );
}

beforeEach(() => {
  lockHeld = false;
  listener = undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
  );

  vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
    listener = callback as typeof listener;
    return {
      data: { subscription: { unsubscribe: vi.fn() } },
    } as unknown as ReturnType<typeof supabase.auth.onAuthStateChange>;
  });

  vi.mocked(supabase.auth.getSession).mockImplementation(async () => {
    if (lockHeld) return neverResolves();
    return { data: { session: null }, error: null };
  });

  vi.mocked(supabase.auth.signOut).mockReset();
  vi.mocked(supabase.auth.getUser).mockImplementation(async () => {
    if (lockHeld) return neverResolves();
    return {
      data: { user: null },
      error: {
        name: "AuthSessionMissingError",
        message: "Auth session missing!",
        status: 400,
      },
    } as Awaited<ReturnType<typeof supabase.auth.getUser>>;
  });

  vi.mocked(supabase.auth.signInWithPassword).mockImplementation(async () => {
    const session = sessionFor(TEST_EMAIL);
    await notify("SIGNED_IN", session);
    return { data: { user: session.user, session }, error: null };
  });

  vi.mocked(supabase.from).mockImplementation(
    () =>
      ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              if (lockHeld) return neverResolves();
              return {
                data: {
                  id: "user-1",
                  display_name: "Ada",
                  is_admin: false,
                },
                error: null,
              };
            },
          }),
        }),
      }) as unknown as ReturnType<typeof supabase.from>,
  );
});

afterEach(() => {
  lockHeld = false;
  listener = undefined;
  vi.unstubAllGlobals();
  for (const name of authTokenCookieNames(document.cookie)) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
  }
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("AuthProvider password sign-in", () => {
  it("does not await Supabase queries inside onAuthStateChange (auth lock)", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("auth-loading")).toHaveTextContent("ready"),
    );

    expect(listener).toEqual(expect.any(Function));
    await act(async () => {
      const result = listener?.("SIGNED_IN", sessionFor(TEST_EMAIL));
      expect(result).toBeUndefined();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it("resolves sign-in while a profile row is fetched after the lock", async () => {
    let settled: { error: Error | null } | undefined;
    render(
      <AuthProvider>
        <SignInHarness
          onResult={(result) => {
            settled = result;
          }}
        />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await expectResolves(
      waitFor(() => {
        expect(settled).toEqual({ error: null });
      }),
      "signIn",
    );
  });

  it("applies the profile after SIGNED_IN without blocking the token response", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("auth-loading")).toHaveTextContent("ready"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign in form" }));

    await expectResolves(
      waitFor(() =>
        expect(screen.getByTestId("auth-user")).toHaveTextContent(TEST_EMAIL),
      ),
      "session user",
    );
    await waitFor(() =>
      expect(screen.getByTestId("auth-name")).toHaveTextContent("Ada"),
    );
  });

  it("clears the session before the sign-out request finishes", async () => {
    let releaseSignOut!: () => void;
    vi.mocked(supabase.auth.signOut).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseSignOut = () =>
            resolve({ error: null } as Awaited<
              ReturnType<typeof supabase.auth.signOut>
            >);
        }),
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("auth-loading")).toHaveTextContent("ready"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign in form" }));
    await waitFor(() =>
      expect(screen.getByTestId("auth-user")).toHaveTextContent(TEST_EMAIL),
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByTestId("auth-user")).toHaveTextContent("guest");
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    await act(async () => {
      releaseSignOut();
    });
  });

  it("treats a cached session as signed out when getUser returns AuthApiError 401", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: sessionFor(TEST_EMAIL) },
      error: null,
    });
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: {
        message: "invalid JWT",
        name: "AuthApiError",
        status: 401,
        code: "bad_jwt",
      },
    } as Awaited<ReturnType<typeof supabase.auth.getUser>>);
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("auth-user")).toHaveTextContent("guest"),
    );
    expect(supabase.auth.getUser).toHaveBeenCalled();
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("treats AuthApiError 403 as an invalid session", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: sessionFor(TEST_EMAIL) },
      error: null,
    });
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: {
        message: "User from sub claim in JWT does not exist",
        name: "AuthApiError",
        status: 403,
        code: "user_not_found",
      },
    } as Awaited<ReturnType<typeof supabase.auth.getUser>>);
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("auth-user")).toHaveTextContent("guest"),
    );
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("keeps the cached session when getUser is offline or returns 5xx", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: sessionFor(TEST_EMAIL) },
      error: null,
    });
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: {
        message: "Service unavailable",
        name: "AuthRetryableFetchError",
        status: 503,
      },
    } as Awaited<ReturnType<typeof supabase.auth.getUser>>);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("auth-user")).toHaveTextContent(TEST_EMAIL),
    );
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it("keeps chrome loading until getUser finishes so INITIAL_SESSION cannot flash", async () => {
    let releaseGetUser!: (
      value: Awaited<ReturnType<typeof supabase.auth.getUser>>,
    ) => void;
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: sessionFor(TEST_EMAIL) },
      error: null,
    });
    vi.mocked(supabase.auth.getUser).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseGetUser = resolve;
        }),
    );
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(listener).toEqual(expect.any(Function)));
    await act(async () => {
      listener?.("INITIAL_SESSION", sessionFor(TEST_EMAIL));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(screen.getByTestId("auth-loading")).toHaveTextContent("loading");
    expect(screen.getByTestId("auth-user")).toHaveTextContent("guest");
    expect(screen.queryByText(TEST_EMAIL)).toBeNull();

    await act(async () => {
      releaseGetUser({
        data: { user: null },
        error: {
          message: "invalid JWT",
          name: "AuthApiError",
          status: 401,
          code: "bad_jwt",
        },
      } as Awaited<ReturnType<typeof supabase.auth.getUser>>);
    });
    await waitFor(() =>
      expect(screen.getByTestId("auth-loading")).toHaveTextContent("ready"),
    );
    expect(screen.getByTestId("auth-user")).toHaveTextContent("guest");
    expect(screen.queryByText(TEST_EMAIL)).toBeNull();
  });

  it("clears chrome on SIGNED_OUT even when a stale session is attached", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("auth-loading")).toHaveTextContent("ready"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign in form" }));
    await waitFor(() =>
      expect(screen.getByTestId("auth-user")).toHaveTextContent(TEST_EMAIL),
    );

    await act(async () => {
      listener?.("SIGNED_OUT", sessionFor(TEST_EMAIL));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(screen.getByTestId("auth-user")).toHaveTextContent("guest");

    await act(async () => {
      listener?.("TOKEN_REFRESHED", sessionFor(TEST_EMAIL));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(screen.getByTestId("auth-user")).toHaveTextContent("guest");
  });

  it("drops auth cookies before a hung logout so reload cannot restore the account", async () => {
    const first = render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("auth-loading")).toHaveTextContent("ready"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign in form" }));
    await waitFor(() =>
      expect(screen.getByTestId("auth-account")).toHaveTextContent(TEST_EMAIL),
    );

    document.cookie = "sb-xyz-auth-token=chunk";
    document.cookie = "sb-xyz-auth-token.0=aaa";
    window.localStorage.setItem("sb-xyz-auth-token", '{"access_token":"x"}');
    window.sessionStorage.setItem("sb-xyz-auth-token.1", "bbb");

    vi.mocked(supabase.auth.signOut).mockImplementation(() => neverResolves());
    vi.mocked(supabase.auth.getSession).mockImplementation(async () => {
      if (authTokenCookieNames(document.cookie).length === 0) {
        return { data: { session: null }, error: null };
      }
      return { data: { session: sessionFor(TEST_EMAIL) }, error: null };
    });
    const logoutFetch = vi.fn(() => neverResolves<Response>());
    vi.stubGlobal("fetch", logoutFetch);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByTestId("auth-account")).toBeNull();
    expect(authTokenCookieNames(document.cookie)).toEqual([]);
    expect(window.localStorage.getItem("sb-xyz-auth-token")).toBeNull();
    expect(window.sessionStorage.getItem("sb-xyz-auth-token.1")).toBeNull();
    expect(logoutFetch).toHaveBeenCalledWith(
      supabaseLocalLogoutUrl(SUPABASE_URL),
      expect.objectContaining({
        method: "POST",
        keepalive: true,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: "Bearer test-access",
        },
      }),
    );

    first.unmount();
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("auth-loading")).toHaveTextContent("ready"),
    );
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByTestId("auth-user")).toHaveTextContent("guest");
    expect(screen.queryByText(TEST_EMAIL)).toBeNull();
  });

  it("does not let a late profile response resurrect the previous user", async () => {
    let releaseProfile!: () => void;
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                new Promise((resolve) => {
                  releaseProfile = () =>
                    resolve({
                      data: {
                        id: "user-1",
                        display_name: "Ada",
                        is_admin: false,
                      },
                      error: null,
                    });
                }),
            }),
          }),
        }) as unknown as ReturnType<typeof supabase.from>,
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("auth-loading")).toHaveTextContent("ready"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign in form" }));
    await waitFor(() =>
      expect(screen.getByTestId("auth-user")).toHaveTextContent(TEST_EMAIL),
    );
    expect(screen.getByTestId("auth-name")).toHaveTextContent("");

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();

    await act(async () => {
      releaseProfile();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(screen.getByTestId("auth-user")).toHaveTextContent("guest");
    expect(screen.getByTestId("auth-name")).toHaveTextContent("");
    expect(screen.queryByText("Ada")).toBeNull();
  });
});
