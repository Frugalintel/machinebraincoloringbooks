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
import { supabase } from "@/lib/supabase";

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

function sessionFor(email: string): Session {
  return {
    access_token: "test-access",
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
  const { user, isLoading, signIn } = useAuth();
  return (
    <div>
      <span data-testid="auth-loading">{isLoading ? "loading" : "ready"}</span>
      <span data-testid="auth-user">{user?.email ?? "guest"}</span>
      <span data-testid="auth-name">{user?.displayName ?? ""}</span>
      <button
        type="button"
        onClick={() => {
          void signIn(TEST_EMAIL, TEST_PASSWORD);
        }}
      >
        Sign in
      </button>
    </div>
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

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

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
});
