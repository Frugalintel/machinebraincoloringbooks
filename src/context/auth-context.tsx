"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Profile } from "@/lib/types";
import { logger } from "@/lib/logger";

type User = {
  email: string;
  id: string;
  initials?: string;
  role?: 'user' | 'admin';
  displayName?: string;
  avatarUrl?: string;
};

type AuthModalState = {
  isOpen: boolean;
  view: 'login' | 'register';
  email?: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  authModal: AuthModalState;
  openAuthModal: (view?: 'login' | 'register', email?: string) => void;
  closeAuthModal: () => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModal, setAuthModal] = useState<AuthModalState>({ isOpen: false, view: 'login' });
  const router = useRouter();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  // Convert Supabase user to our User type
  // Role is now determined by the is_admin flag in the profiles table
  const formatUser = useCallback((supabaseUser: SupabaseUser | null, profile?: Profile): User | null => {
    if (!supabaseUser?.email) return null;
    
    return {
      email: supabaseUser.email,
      id: supabaseUser.id,
      initials: getInitials(supabaseUser.email),
      role: profile?.is_admin ? 'admin' : 'user',
      displayName: profile?.display_name || undefined,
      avatarUrl: profile?.avatar_url || undefined,
    };
  }, []);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        logger.error('Error fetching profile:', error);
      }
      return data;
    } catch (err) {
      logger.error('Error fetching profile:', err);
      return null;
    }
  }, []);

    // Initialize auth state
    useEffect(() => {
    if (!isSupabaseConfigured) {
      logger.warn('Supabase not configured. Authentication will not work.');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const initAuth = async () => {
      try {
        // Setup listener first to catch any events during initialization
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (!mounted) return;
          
          if (newSession?.user) {
            setSession(newSession);
            // Only fetch profile if we have a user and session changed significantly
            // or if we don't have a user set yet
            const profile = await fetchProfile(newSession.user.id);
            if (mounted) {
              setUser(formatUser(newSession.user, profile));
            }
          } else {
            if (mounted) {
              setSession(null);
              setUser(null);
            }
          }
          
          // Close modal on successful auth
          if (event === 'SIGNED_IN' && mounted) {
             setAuthModal(prev => ({ ...prev, isOpen: false }));
          }
          
          if (mounted) setIsLoading(false);
        });

        // Get initial session to ensure we have state before first render if possible
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
            if (initialSession?.user) {
                setSession(initialSession);
                const profile = await fetchProfile(initialSession.user.id);
                if (mounted) {
                    setUser(formatUser(initialSession.user, profile));
                }
            }
            // Even if no initial session, we're done loading the initial check
            // However, onAuthStateChange might fire INITIAL_SESSION right after.
            // We'll let onAuthStateChange handle the final isLoading=false usually,
            // but if there's no session, we need to ensure loading stops.
            if (!initialSession) {
                setIsLoading(false);
            }
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        logger.error('Auth initialization error:', error);
        if (mounted) setIsLoading(false);
        return () => {};
      }
    };

    const cleanupPromise = initAuth();

    return () => {
      mounted = false;
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [formatUser, fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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
    try {
      await supabase.auth.signOut();
    } catch (error) {
      logger.error("Error signing out:", error);
    } finally {
      // Always clear local state and redirect, even if server request fails
      setUser(null);
      setSession(null);
      router.push("/");
      router.refresh();
    }
  }, [router]);

  const openAuthModal = useCallback((view: 'login' | 'register' = 'login', email?: string) => {
    setAuthModal({ isOpen: true, view, email });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    signIn,
    signUp,
    signOut,
    isLoading,
    authModal,
    openAuthModal,
    closeAuthModal,
    isAdmin: user?.role === 'admin',
  }), [user, session, signIn, signUp, signOut, isLoading, authModal, openAuthModal, closeAuthModal]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
