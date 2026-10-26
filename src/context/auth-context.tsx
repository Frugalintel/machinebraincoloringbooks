"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import {
  applyAuthStateChange,
  clearLocalAuthCopies,
  shouldApplyHydratedProfile,
  validateStoredSession,
} from "@/lib/auth-session";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Profile } from "@/lib/types";
import { logger } from "@/lib/logger";
import { withAuthTimeout, type AuthHold } from "@/lib/auth-ui";

type User = {
  email: string;
  id: string;
  initials?: string;
  role?: "user" | "admin";
  displayName?: string;
  avatarUrl?: string;
};

type AuthModalState = {
  isOpen: boolean;
  view: "login" | "register";
  email?: string;
  /** A page code the popup is holding, e.g. from /scan; shows "Keep your / code." */
  code?: string;
  /** Scan holds: book QR or a page-code +1. Existing `code` stays "Keep your code." */
  hold?: AuthHold;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  /** True while this browser is signing out, so /profile/me does not bounce to /auth. */
  signingOut: boolean;
  authModal: AuthModalState;
  openAuthModal: (
    view?: "login" | "register",
    email?: string,
    code?: string,
    hold?: AuthHold,
  ) => void;
  closeAuthModal: () => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function dropLocalAuthCopies() {
  if (typeof document === "undefined") return;
  clearLocalAuthCopies({
    document,
    localStorage: typeof window === "undefined" ? null : window.localStorage,
    sessionStorage:
      typeof window === "undefined" ? null : window.sessionStorage,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [authModal, setAuthModal] = useState<AuthModalState>({
    isOpen: false,
    view: "login",
  });
  const router = useRouter();
  const signedOutLocallyRef = useRef(false);
  const sessionUserIdRef = useRef<string | null>(null);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  // Convert Supabase user to our User type
  // Role is now determined by the is_admin flag in the profiles table
  const formatUser = useCallback(
    (supabaseUser: SupabaseUser | null, profile?: Profile): User | null => {
      if (!supabaseUser?.email) return null;

      return {
        email: supabaseUser.email,
        id: supabaseUser.id,
        initials: getInitials(supabaseUser.email),
        role: profile?.is_admin ? "admin" : "user",
        displayName: profile?.display_name || undefined,
        avatarUrl: profile?.avatar_url || undefined,
      };
    },
    [],
  );

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        logger.error("Error fetching profile:", error);
      }
      return data;
    } catch (err) {
      logger.error("Error fetching profile:", err);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured) {
      logger.warn("Supabase not configured. Authentication will not work.");
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const initAuth = async () => {
      try {
        // Setup listener first to catch any events during initialization
        const hydrateProfile = (sessionUser: SupabaseUser) => {
          const requestedUserId = sessionUser.id;
          window.setTimeout(() => {
            void fetchProfile(requestedUserId).then((profile) => {
              if (!mounted) return;
              if (
                !shouldApplyHydratedProfile({
                  requestedUserId,
                  currentUserId: sessionUserIdRef.current,
                  signedOutLocally: signedOutLocallyRef.current,
                })
              ) {
                return;
              }
              setUser(formatUser(sessionUser, profile ?? undefined));
            });
          }, 0);
        };

        const applySession = (event: string, newSession: Session | null) => {
          if (!mounted) return;

          const decision = applyAuthStateChange(event, newSession, {
            signedOutLocally: signedOutLocallyRef.current,
          });

          switch (decision.kind) {
            case "ignore":
              setIsLoading(false);
              return;
            case "signed-out":
              signedOutLocallyRef.current = true;
              sessionUserIdRef.current = null;
              setSession(null);
              setUser(null);
              dropLocalAuthCopies();
              setIsLoading(false);
              return;
            case "signed-in": {
              signedOutLocallyRef.current = false;
              const nextSession = (decision.session as Session) ?? newSession;
              if (nextSession?.user) {
                sessionUserIdRef.current = nextSession.user.id;
                setSession(nextSession);
                setUser(formatUser(nextSession.user));
                hydrateProfile(nextSession.user);
              }
              if (event === "SIGNED_IN") {
                setAuthModal((prev) => ({ ...prev, isOpen: false }));
              }
              setIsLoading(false);
              return;
            }
            default: {
              const _exhaustive: never = decision;
              return _exhaustive;
            }
          }
        };

        // supabase-js 2.84 holds navigator.locks and awaits this callback.
        // fetchProfile uses supabase.from(), which needs that same lock, so
        // awaiting it here deadlocks signInWithPassword (auth-js#762).
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, newSession) => {
          setTimeout(() => {
            applySession(event, newSession);
          }, 0);
        });

        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        const validated = await validateStoredSession(initialSession, () =>
          supabase.auth.getUser(),
        );

        if (mounted) {
          if (validated.ok && validated.session.user) {
            signedOutLocallyRef.current = false;
            sessionUserIdRef.current = validated.session.user.id;
            setSession(validated.session);
            setUser(formatUser(validated.user));
            hydrateProfile(validated.session.user);
          } else {
            if (initialSession?.user) {
              signedOutLocallyRef.current = true;
              sessionUserIdRef.current = null;
              dropLocalAuthCopies();
              try {
                await supabase.auth.signOut({ scope: "local" });
              } catch (error) {
                logger.error("Error clearing invalid session:", error);
              }
            }
            setSession(null);
            setUser(null);
          }
          setIsLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        logger.error("Auth initialization error:", error);
        if (mounted) setIsLoading(false);
        return () => {};
      }
    };

    const cleanupPromise = initAuth();

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted || !isSupabaseConfigured) return;
      void supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          setUser(null);
          setSession(null);
          setIsLoading(false);
        }
      });
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      mounted = false;
      window.removeEventListener("pageshow", onPageShow);
      cleanupPromise.then((cleanup) => cleanup && cleanup());
    };
  }, [formatUser, fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await withAuthTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
      );

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error, needsConfirmation: false };
      }

      // Check if email confirmation is required
      const needsConfirmation = !data.session && !!data.user;

      return { error: null, needsConfirmation };
    } catch (error) {
      return { error: error as Error, needsConfirmation: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    // Drop chrome and stored tokens immediately. supabase.auth.signOut only
    // deletes the cookie after the logout request returns; a reload that
    // cancels that request used to leave the previous account in chrome.
    signedOutLocallyRef.current = true;
    sessionUserIdRef.current = null;
    setSigningOut(true);
    setUser(null);
    setSession(null);
    setAuthModal({ isOpen: false, view: "login" });
    setIsLoading(false);
    dropLocalAuthCopies();
    router.replace("/");
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      logger.error("Error signing out:", error);
    } finally {
      dropLocalAuthCopies();
      router.refresh();
      setSigningOut(false);
    }
  }, [router]);

  const openAuthModal = useCallback(
    (
      view: "login" | "register" = "login",
      email?: string,
      code?: string,
      hold?: AuthHold,
    ) => {
      setAuthModal({
        isOpen: true,
        view,
        email,
        code,
        hold: hold ?? (code ? { kind: "code", label: code } : undefined),
      });
    },
    [],
  );

  const closeAuthModal = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      signIn,
      signUp,
      signOut,
      isLoading,
      signingOut,
      authModal,
      openAuthModal,
      closeAuthModal,
      isAdmin: user?.role === "admin",
    }),
    [
      user,
      session,
      signIn,
      signUp,
      signOut,
      isLoading,
      signingOut,
      authModal,
      openAuthModal,
      closeAuthModal,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/** Footers still render in page tests that do not wrap AuthProvider. */
export function useOptionalAuth(): Pick<AuthContextType, "user" | "signOut"> {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return { user: null, signOut: async () => undefined };
  }
  return context;
}
