"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

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

// Hardcoded admin emails - UPDATE THIS WITH YOUR ACTUAL ADMIN EMAILS
const ADMIN_EMAILS = [
  'jaydensaxton.c@outlook.com',
  'jayden@example.com',
  'demo@machinebrain.com',
  // Add your real admin email here
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModal, setAuthModal] = useState<AuthModalState>({ isOpen: false, view: 'login' });
  const router = useRouter();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getUserRole = (email: string): 'user' | 'admin' => {
    return ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';
  };

  // Convert Supabase user to our User type
  const formatUser = useCallback((supabaseUser: SupabaseUser | null, profile?: any): User | null => {
    if (!supabaseUser?.email) return null;
    
    return {
      email: supabaseUser.email,
      id: supabaseUser.id,
      initials: getInitials(supabaseUser.email),
      role: getUserRole(supabaseUser.email),
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
        console.error('Error fetching profile:', error);
      }
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Authentication will not work.');
      setIsLoading(false);
      return;
    }

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          setSession(initialSession);
          const profile = await fetchProfile(initialSession.user.id);
          setUser(formatUser(initialSession.user, profile));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      
      setSession(newSession);
      
      if (newSession?.user) {
        const profile = await fetchProfile(newSession.user.id);
        setUser(formatUser(newSession.user, profile));
      } else {
        setUser(null);
      }

      // Close modal on successful auth
      if (event === 'SIGNED_IN') {
        setAuthModal(prev => ({ ...prev, isOpen: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push("/");
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
