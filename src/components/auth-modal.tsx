"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, Lock, User, ArrowRight, AlertCircle, Chrome, Command, Facebook, Twitter, CheckCircle, X, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase";

export function AuthModal() {
  const { authModal, closeAuthModal, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (authModal.isOpen) {
      setIsLogin(authModal.view === 'login');
      if (authModal.email) setEmail(authModal.email);
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [authModal]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Validation
    if (!email || !password) {
      setErrorMsg("Please enter email and password.");
      setLoading(false);
      return;
    }
    
    if (!isLogin && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (!isLogin && password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg("Database not configured. Please set up Supabase credentials.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login")) {
            setErrorMsg("Invalid email or password.");
          } else if (error.message.includes("Email not confirmed")) {
            setErrorMsg("Please check your email to confirm your account.");
          } else {
            setErrorMsg(error.message);
          }
          return;
        }
        // Success - modal will close automatically via auth state change
        router.push("/profile/me");
      } else {
        const { error, needsConfirmation } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered") || error.message.includes("already exists")) {
            setIsLogin(true);
            setErrorMsg("Account already exists. Please log in.");
          } else {
            setErrorMsg(error.message);
          }
          return;
        }
        
        if (needsConfirmation) {
          setSuccessMsg("Check your email for the confirmation link!");
        } else {
          // Auto-confirmed, redirect
          router.push("/profile/me");
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider: string) => {
    // TODO: Implement social auth with Supabase
    setErrorMsg(`${provider} login coming soon. Please use email/password for now.`);
  };

  const SocialButton = ({ provider, icon: Icon, label }: { provider: string, icon: React.ElementType, label: string }) => {
    return (
      <button 
        type="button"
        onClick={() => handleSocialAuth(provider)} 
        className="h-12 border bg-[#111] hover:bg-white hover:text-black transition-all flex items-center justify-center group border-[#333] text-gray-400 hover:border-white"
      >
        <Icon size={18} className="mr-2" />
        <span className="text-xs font-heading uppercase tracking-wider">{label}</span>
      </button>
    );
  };

  const SocialSection = (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <SocialButton provider="Google" icon={Chrome} label="Google" />
      <SocialButton provider="Apple" icon={Command} label="Apple" />
      <SocialButton provider="Facebook" icon={Facebook} label="Facebook" />
      <SocialButton provider="Twitter" icon={Twitter} label="Twitter" />
    </div>
  );

  const Divider = ({ text }: { text: string }) => (
    <div className="relative py-2 mb-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-[#333]" />
      </div>
      <div className="relative flex justify-center text-[10px] uppercase font-mono">
        <span className="bg-[#0a0a0a] px-2 text-gray-600">{text}</span>
      </div>
    </div>
  );

  const FormSection = (
    <form onSubmit={handleAuth} className="space-y-6 mb-6">
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono flex items-center gap-2">
          <User size={10} /> Email Address
        </label>
        <Input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          className="bg-[#111] border-[#333] text-white focus:border-primary focus:ring-0 h-12 rounded-none font-mono text-sm placeholder:text-gray-700"
          placeholder="you@example.com"
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono flex items-center gap-2">
          <Lock size={10} /> Password
        </label>
        <Input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          className="bg-[#111] border-[#333] text-white focus:border-primary focus:ring-0 h-12 rounded-none font-mono text-sm placeholder:text-gray-700"
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      {!isLogin && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-2 overflow-hidden"
        >
          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono flex items-center gap-2">
            <CheckCircle size={10} /> Confirm Password
          </label>
          <Input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-[#111] border-[#333] text-white focus:border-primary focus:ring-0 h-12 rounded-none font-mono text-sm placeholder:text-gray-700"
            placeholder="••••••••"
            disabled={loading}
          />
        </motion.div>
      )}
      
      <Button 
        type="submit" 
        disabled={loading}
        className="w-full h-14 bg-primary hover:bg-white hover:text-black text-white font-heading text-xl tracking-[0.2em] rounded-none uppercase transition-all mt-4 group disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {isLogin ? "Sign In" : "Create Account"}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>
    </form>
  );

  return (
    <AnimatePresence>
      {authModal.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
            onClick={closeAuthModal}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] p-4"
          >
            <div className="bg-[#0a0a0a] border border-[#333] shadow-2xl relative">
              <div className="h-2 w-full bg-primary"></div>
              
              {/* Close Button */}
              <button onClick={closeAuthModal} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                <X size={20} />
              </button>

              <div className="p-8">
                <div className="text-center mb-8">
                  <h1 className="font-heading text-3xl font-bold text-white mb-2 uppercase tracking-tighter text-primary">
                    Machine Brain
                  </h1>
                  <div className="flex items-center justify-center gap-2 tracking-widest text-[10px] font-mono uppercase mt-2 text-primary">
                    <Terminal size={12} />
                    <span>{isLogin ? "System Access" : "New Identity"}</span>
                  </div>
                </div>

                {/* Supabase not configured warning */}
                {!isSupabaseConfigured && (
                  <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-900/50 text-xs text-yellow-400 font-mono">
                    <AlertCircle size={14} className="inline mr-2" />
                    Database not configured. Add Supabase credentials to .env.local
                  </div>
                )}

                {errorMsg && (
                  <div className="mb-6 p-3 bg-red-900/20 border border-red-900/50 flex items-start gap-3 text-xs text-red-400 font-mono">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-6 p-3 bg-green-900/20 border border-green-900/50 flex items-start gap-3 text-xs text-green-400 font-mono">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex mb-8 border-b border-[#333]">
                  <button
                    onClick={() => { setIsLogin(true); setErrorMsg(""); setSuccessMsg(""); }}
                    className={`flex-1 pb-3 text-xs tracking-[0.2em] uppercase transition-all border-b-2 ${isLogin ? "border-primary text-white" : "border-transparent text-gray-600 hover:text-gray-400"}`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setIsLogin(false); setErrorMsg(""); setSuccessMsg(""); }}
                    className={`flex-1 pb-3 text-xs tracking-[0.2em] uppercase transition-all border-b-2 ${!isLogin ? "border-primary text-white" : "border-transparent text-gray-600 hover:text-gray-400"}`}
                  >
                    Register
                  </button>
                </div>

                {isLogin ? (
                  <>
                    {FormSection}
                    <Divider text="Or access via provider" />
                    {SocialSection}
                    <div className="mt-4 text-center border-t border-[#333] pt-4">
                      <button onClick={() => {}} className="text-[10px] text-gray-600 hover:text-primary transition-colors uppercase tracking-widest font-mono">
                        Forgot Password?
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {SocialSection}
                    <Divider text="Or register with email" />
                    {FormSection}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
