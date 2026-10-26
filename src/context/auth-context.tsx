"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModal, setAuthModal] = useState<AuthModalState>({
    isOpen: false,
    view: "login",
  });
  const router = useRouter();

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
          window.setTimeout(() => {
            void fetchProfile(sessionUser.id).then((profile) => {
              if (mounted) {
                setUser(formatUser(sessionUser, profile ?? undefined));
              }
            });
          }, 0);
        };

        const applySession = (event: string, newSession: Session | null) => {
          if (!mounted) return;

          // Paint the session immediately. Awaiting profiles here used to keep
          // isLoading true (and /store gated on it) for tens of seconds.
          if (newSession?.user) {
            setSession(newSession);
            setUser(formatUser(newSession.user));
            hydrateProfile(newSession.user);
          } else {
            setSession(null);
            setUser(null);
          }

          if (event === "SIGNED_IN") {
            setAuthModal((prev) => ({ ...prev, isOpen: false }));
          }

          setIsLoading(false);
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

        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(formatUser(initialSession.user));
            hydrateProfile(initialSession.user);
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
    // Drop chrome immediately so mobile menus cannot keep a stale Sign out.
    setUser(null);
    setSession(null);
    setAuthModal({ isOpen: false, view: "login" });
    setIsLoading(false);
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch (error) {
      logger.error("Error signing out:", error);
    } finally {
      router.replace("/");
      router.refresh();
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
