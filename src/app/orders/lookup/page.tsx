"use client";

import { useState } from "react";
import { Search, Package, Truck, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OrderLookupPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    // Mock Lookup
    setTimeout(() => {
      if (orderId.toLowerCase().includes("err")) {
        setStatus("error");
      } else {
        setStatus("success");
      }
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <div className="container mx-auto px-4 md:px-6 py-20 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tighter mb-4">
              Order Tracking
            </h1>
            <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
              Enter your order details to check the status.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#333] p-8 relative overflow-hidden shadow-2xl">
            {/* Top Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent"></div>

            {status === "success" ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-green-500 mb-4">
                  <CheckCircle size={20} />
                  <span className="font-mono text-sm uppercase tracking-widest">
                    Order Found
                  </span>
                </div>

                <div className="space-y-4 border-b border-[#333] pb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs font-mono uppercase">
                      Order ID
                    </span>
                    <span className="text-white font-heading tracking-wide">
                      {orderId || "#ORD-8829"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs font-mono uppercase">
                      Status
                    </span>
                    <span className="bg-primary/10 text-primary border border-primary/30 px-2 py-1 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2">
                      <Truck size={10} /> In Transit
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs font-mono uppercase">
                      Est. Delivery
                    </span>
                    <span className="text-white font-sans">Nov 24, 2025</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-white text-sm">Processing Complete</p>
                      <p className="text-gray-600 text-xs font-mono">Hub 04</p>
                    </div>
                    <span className="text-gray-600 text-xs font-mono">
                      10:00 AM
                    </span>
                  </div>
                  <div className="w-0.5 h-6 bg-[#333] ml-1"></div>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="text-white text-sm">Out for Delivery</p>
                      <p className="text-gray-600 text-xs font-mono">
                        Local Courier
                      </p>
                    </div>
                    <span className="text-gray-600 text-xs font-mono">Now</span>
                  </div>
                </div>

                <Button
                  onClick={() => setStatus("idle")}
                  variant="outline"
                  className="w-full border-[#333] hover:border-white hover:text-white text-gray-500 font-heading uppercase tracking-widest h-12 rounded-none mt-4"
                >
                  Track Another
                </Button>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleLookup}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono flex items-center gap-2">
                    <Package size={12} /> Order ID
                  </label>
                  <Input
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="bg-[#111] border-[#333] text-white font-mono text-base md:text-sm h-12 rounded-none focus:border-primary focus:ring-0 placeholder:text-gray-700"
                    placeholder="ORD-XXXX-XXXX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono flex items-center gap-2">
                    <Search size={12} /> Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#111] border-[#333] text-white font-mono text-base md:text-sm h-12 rounded-none focus:border-primary focus:ring-0 placeholder:text-gray-700"
                    placeholder="billing@email.com"
                    required
                  />
                </div>

                {status === "error" && (
                  <div className="p-3 bg-red-900/20 border border-red-900/50 flex items-center gap-3 text-xs text-red-400 font-mono">
                    <AlertCircle size={14} />
                    <span>Order not found. Check ID and try again.</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full h-12 bg-primary hover:bg-white hover:text-black text-white font-heading text-xl tracking-[0.2em] rounded-none uppercase transition-all group"
                >
                  {status === "loading"
                    ? "Searching Database..."
                    : "Track Order"}
                </Button>
              </motion.form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
