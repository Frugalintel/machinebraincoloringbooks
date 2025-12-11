"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ChevronRight, CheckCircle, Chrome, Github, Command, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

export function NewsletterModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const { openAuthModal } = useAuth();

  useEffect(() => {
    // Check if already dismissed or subscribed
    const hasSeenNewsletter = localStorage.getItem("machine-brain-newsletter-seen");
    if (!hasSeenNewsletter) {
        const timer = setTimeout(() => setIsOpen(true), 3000); // 3s delay for better UX
        return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("machine-brain-newsletter-seen", "true");
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => setIsSubmitted(true), 500);
    localStorage.setItem("machine-brain-newsletter-seen", "true");
  };

  const handleSocialMock = (provider: string) => {
      alert(`${provider} Connection Simulated. In production, this would instantly create an account.`);
      setIsSubmitted(true);
      localStorage.setItem("machine-brain-newsletter-seen", "true");
  };

  const handleAuthAction = (mode: 'login' | 'register') => {
      setIsOpen(false); // Close newsletter modal
      openAuthModal(mode, email); // Open auth modal with pre-filled email
  };

  return (
    <AnimatePresence>
      {isOpen ? <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[101] p-4"
          >
            <div className="bg-[#0a0a0a] border border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                {/* Close Button */}
                <div className="absolute top-2 right-2 z-20">
                    <button onClick={handleDismiss} className="p-2 text-gray-500 hover:text-white transition-colors bg-[#0a0a0a] rounded-full hover:bg-[#222]">
                        <X size={20} />
                    </button>
                </div>

                {/* Content Split */}
                <div className="flex flex-col">
                    
                    {/* Image/Banner Area */}
                    <div className="h-32 bg-[#111] relative overflow-hidden flex items-center justify-center border-b border-[#222]">
                        <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10"></div>
                        <div className="absolute inset-0 pointer-events-none" 
                             style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,79,0,0.1) 0%, transparent 50%)' }}>
                        </div>
                        <div className="text-center relative z-10">
                            <h2 className="font-heading text-5xl text-white tracking-tighter leading-none">15% OFF</h2>
                            <p className="font-mono text-xs text-primary uppercase tracking-[0.3em] mt-1">First Order Only</p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10 bg-[#0a0a0a]">
                        <AnimatePresence mode="wait">
                            {!isSubmitted ? (
                                <motion.div
                                    key="offer"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center mb-6">
                                        <h3 className="font-heading text-2xl text-white uppercase mb-2">Unlock Your Welcome Gift</h3>
                                        <p className="text-gray-400 font-sans text-sm">
                                            Join the Machine Brain network to access exclusive drops, digital artifacts, and your discount code.
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => handleSocialMock('Google')}
                                            className="w-full h-12 bg-white hover:bg-gray-200 text-black font-bold flex items-center justify-center gap-3 transition-colors rounded-none uppercase tracking-wide text-xs"
                                        >
                                            <Chrome size={18} /> Continue with Google
                                        </button>
                                        <button 
                                            onClick={() => handleSocialMock('Apple')}
                                            className="w-full h-12 bg-[#222] hover:bg-[#333] text-white font-bold flex items-center justify-center gap-3 transition-colors border border-[#222] rounded-none uppercase tracking-wide text-xs"
                                        >
                                            <Command size={18} /> Continue with Apple
                                        </button>
                                    </div>

                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-[#222]" />
                                        </div>
                                        <div className="relative flex justify-center text-[10px] uppercase font-mono">
                                            <span className="bg-[#0a0a0a] px-2 text-gray-600">Or enter email</span>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubscribe} className="flex gap-2">
                                        <Input 
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="EMAIL_ADDRESS"
                                            className="bg-[#111] border-[#222] text-white font-mono text-base md:text-xs h-12 rounded-none focus:border-primary focus:ring-0 placeholder:text-gray-700"
                                            required
                                        />
                                        <Button type="submit" className="bg-primary hover:bg-white hover:text-black text-white h-12 px-6 rounded-none">
                                            <ChevronRight size={20} />
                                        </Button>
                                    </form>
                                    
                                    <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                                        By signing up, you agree to our Terms of Service and Privacy Policy. No spam, ever.
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                    className="text-center py-4"
                                >
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle size={32} className="text-primary" />
                                    </div>
                                    
                                    <h3 className="font-heading text-3xl text-white uppercase mb-2">Code Unlocked</h3>
                                    <p className="text-gray-400 text-sm mb-6">Your discount has been activated.</p>
                                    
                                    <div className="bg-[#111] border border-primary/30 p-4 mb-8 relative overflow-hidden group cursor-pointer" onClick={() => {navigator.clipboard.writeText("MACHINE15"); alert("Copied!")}}>
                                        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
                                        <p className="text-xs text-primary font-mono uppercase tracking-widest mb-1">Tap to Copy</p>
                                        <p className="text-3xl font-heading text-white tracking-widest">MACHINE15</p>
                                    </div>

                                    <div className="space-y-3">
                                        <Button 
                                            onClick={() => handleAuthAction('register')}
                                            className="w-full bg-white hover:bg-gray-200 text-black font-heading uppercase tracking-widest h-12 rounded-none text-sm"
                                        >
                                            <UserPlus size={16} className="mr-2" /> Create Full Account
                                        </Button>
                                        
                                        <div className="flex justify-between gap-4">
                                            <button 
                                                onClick={() => handleAuthAction('login')}
                                                className="flex-1 flex items-center justify-center gap-2 text-xs font-mono uppercase text-gray-400 hover:text-white border border-[#222] h-10 hover:border-white transition-colors"
                                            >
                                                <LogIn size={12} /> Login
                                            </button>
                                            <button 
                                                onClick={handleDismiss} 
                                                className="flex-1 text-xs font-mono uppercase text-gray-600 hover:text-white transition-colors"
                                            >
                                                Continue as Guest
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
          </motion.div>
        </> : null}
    </AnimatePresence>
  );
}
