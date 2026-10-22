"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Terminal,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Chrome,
  Command,
  Facebook,
  Twitter,
  CheckCircle,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { BrandLockup } from "@/components/mark";
import { STORAGE_KEYS } from "@/lib/constants";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function AuthPageContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastProvider, setLastProvider] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/profile/me";

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const modeParam = searchParams.get("mode");
    const storedProvider = localStorage.getItem(STORAGE_KEYS.LAST_PROVIDER);

    if (storedProvider) {
      setLastProvider(storedProvider);
    }

    if (emailParam) {
      setEmail(emailParam);
    }

    if (modeParam === "register") {
      setIsLogin(false);
    } else if (modeParam === "login") {
      setIsLogin(true);
    } else if (emailParam && !modeParam) {
      setIsLogin(false);
    }
  }, [searchParams]);

  const handleSocialMock = (provider: string) => {
    localStorage.setItem(STORAGE_KEYS.LAST_PROVIDER, provider);
    alert(`${provider} login coming soon. Please use email/password for now.`);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Validation for empty fields
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      setLoading(false);
      return;
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      setErrorMsg("Database not configured. Please contact support.");
      setLoading(false);
      return;
    }

    // Basic validation for register
    if (!isLogin && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Password length validation
    if (!isLogin && password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    // Save email as last provider
    localStorage.setItem(STORAGE_KEYS.LAST_PROVIDER, "email");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Refresh router to update server components with new auth state
        router.refresh();
        router.push(nextUrl);
        return;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          if (
            error.message.includes("User already registered") ||
            error.message.includes("already exists")
          ) {
            setIsLogin(true);
            setErrorMsg(
              "Account already exists. Please enter your password to login.",
            );
            setLoading(false);
            return;
          }
          throw error;
        }
        if (data.user?.email && !data.session) {
          alert("Check your email for the confirmation link!");
        } else {
          // Refresh router to update server components with new auth state
          router.refresh();
          router.push(nextUrl);
          return;
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An authentication error occurred.";
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const SocialButton = ({
    provider,
    icon: Icon,
    label,
  }: {
    provider: string;
    icon: LucideIcon;
    label: string;
  }) => {
    const isLastUsed = lastProvider === provider;
    return (
      <button
        type="button"
        onClick={() => handleSocialMock(provider)}
        className={`h-12 border bg-background hover:bg-cream hover:text-ink transition-all flex items-center justify-center group relative ${isLastUsed ? "border-primary text-cream" : "border-line text-fg-muted hover:border-cream"}`}
      >
        {isLastUsed ? (
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] bg-primary text-ink px-1.5 font-mono uppercase tracking-wide">
            Last Used
          </span>
        ) : null}
        <Icon
          size={18}
          className={`mr-2 ${isLastUsed ? "text-primary group-hover:text-ink" : ""}`}
        />
        <span className="text-sm font-medium uppercase tracking-[0.06em]">
          {label}
        </span>
      </button>
    );
  };

  const SocialSection = (
    <>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <SocialButton provider="Google" icon={Chrome} label="Google" />
        <SocialButton provider="Apple" icon={Command} label="Apple" />
        <SocialButton provider="Facebook" icon={Facebook} label="Facebook" />
        <SocialButton provider="Twitter" icon={Twitter} label="Twitter" />
      </div>
    </>
  );

  const Divider = ({ text }: { text: string }) => (
    <div className="relative py-2 mb-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-line" />
      </div>
      <div className="relative flex justify-center font-label tracking-[0.08em] text-fg-faint">
        <span className="bg-background px-2">{text}</span>
      </div>
    </div>
  );

  const renderForm = () => (
    <form onSubmit={handleAuth} className="space-y-6 mb-6">
      <div className="space-y-2">
        <label className="font-label flex items-center gap-2 tracking-[0.10em] text-fg-muted">
          <User size={10} /> Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full bg-background text-cream focus:border-primary focus:outline-none focus:ring-0 h-12 rounded-none font-sans text-base placeholder:text-fg-muted px-3 border ${lastProvider === "email" && isLogin ? "border-primary" : "border-line"}`}
          placeholder="user@machinebrain.com"
        />
        {lastProvider === "email" && isLogin ? (
          <div className="text-[9px] text-primary uppercase tracking-widest font-mono text-right">
            Last Used Method
          </div>
        ) : null}
      </div>
      <div className="space-y-2">
        <label className="font-label flex items-center gap-2 tracking-[0.10em] text-fg-muted">
          <Lock size={10} /> Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-background border border-line text-cream focus:border-primary focus:outline-none focus:ring-0 h-12 rounded-none font-sans text-base placeholder:text-fg-muted px-3"
          placeholder="••••••••"
        />
      </div>

      {!isLogin && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-2 overflow-hidden"
        >
          <label className="font-label flex items-center gap-2 tracking-[0.10em] text-fg-muted">
            <CheckCircle size={10} /> Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-background border border-line text-cream focus:border-primary focus:outline-none focus:ring-0 h-12 rounded-none font-sans text-base placeholder:text-fg-muted px-3"
            placeholder="••••••••"
          />
        </motion.div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-14 bg-primary hover:bg-cream hover:text-ink text-cream font-heading font-semibold text-sm tracking-[0.06em] rounded-none uppercase transition-all mt-4 group disabled:opacity-50 flex items-center justify-center"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {isLogin ? "Sign In" : "Create Account"}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative font-sans">
      {/* Technical Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
      <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-background border border-line shadow-2xl"
      >
        {/* Header Strip */}
        <div className="h-2 w-full bg-primary"></div>

        <div className="p-8 md:p-12 relative">
          {/* Corner Artifacts */}
          <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-gray-500"></div>
          <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-gray-500"></div>
          <div className="absolute bottom-4 left-4 w-2 h-2 border-b border-l border-gray-500"></div>
          <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-gray-500"></div>

          <div className="text-center mb-8">
            <BrandLockup
              layout="stacked"
              markSize={80}
              ink="cream"
              headingLevel="h1"
              className="mb-2"
              wordmarkClassName="text-[24px] md:text-[28px]"
            />
            <div className="flex items-center justify-center gap-2 font-label mt-2 tracking-[0.08em] text-primary">
              <Terminal size={12} />
              <span>{isLogin ? "Sign in" : "Create account"}</span>
            </div>
          </div>

          {/* Supabase not configured warning */}
          {!isSupabaseConfigured && (
            <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-900/50 text-xs text-warning font-mono">
              <AlertCircle size={14} className="inline mr-2" />
              Database not configured. Authentication may not work.
            </div>
          )}

          {/* Error Message */}
          {errorMsg ? (
            <div className="mb-6 p-3 bg-danger-wash border border-danger/50 flex items-start gap-3 text-xs text-danger font-mono">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : null}

          {/* Toggle Tabs */}
          <div className="flex mb-8 border-b border-line">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrorMsg("");
              }}
              className={`flex-1 pb-3 text-xs tracking-[0.2em] uppercase transition-all border-b-2 ${isLogin ? "border-primary text-cream" : "border-transparent text-fg-faint hover:text-fg-muted"}`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrorMsg("");
              }}
              className={`flex-1 pb-3 text-xs tracking-[0.2em] uppercase transition-all border-b-2 ${!isLogin ? "border-primary text-cream" : "border-transparent text-fg-faint hover:text-fg-muted"}`}
            >
              Register
            </button>
          </div>

          {isLogin ? (
            <>
              {renderForm()}
              <Divider text="Or access via provider" />
              {SocialSection}
              <div className="mt-8 text-center border-t border-line pt-6">
                <button
                  onClick={() => {}}
                  className="text-sm font-medium uppercase tracking-[0.04em] text-fg-faint hover:text-primary transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </>
          ) : (
            <>
              {SocialSection}
              <Divider text="Or register with email" />
              {renderForm()}
            </>
          )}
        </div>
      </motion.div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-0 w-full border-t border-line bg-background py-2 px-6 flex justify-between items-center text-[10px] text-fg-faint font-mono uppercase tracking-widest">
        <span className="hidden md:inline"></span>
        <span className="animate-pulse text-primary">● Online</span>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function AuthPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-fg-muted font-mono text-xs uppercase tracking-widest">
          Loading...
        </p>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense for useSearchParams
export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <AuthPageContent />
    </Suspense>
  );
}
