"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, cartTotal, isCartOpen, setIsCartOpen } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-[#333] z-50 shadow-2xl flex flex-col"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-5" 
                 style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            {/* Header */}
            <div className="relative z-10 p-6 border-b border-[#333] flex items-center justify-between bg-[#111]">
              <div>
                <h2 className="font-heading text-3xl text-white tracking-wide uppercase">Requisition</h2>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-primary animate-pulse"></div>
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">System Ready</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-[#222] border border-transparent hover:border-[#333] transition-all text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items List */}
            <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <div className="w-20 h-20 border-2 border-dashed border-[#333] flex items-center justify-center mb-4 rounded-full">
                        <ShoppingBag size={32} className="text-[#333]" />
                    </div>
                    <p className="font-heading text-xl text-gray-500 uppercase tracking-widest">No Items Found</p>
                    <p className="text-[10px] font-mono text-gray-600 mt-2 tracking-widest">INITIATE_ORDER_SEQUENCE</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 group bg-[#111] p-3 border border-[#222] hover:border-[#444] transition-colors">
                    {/* Image Placeholder */}
                    <div className="w-20 h-24 bg-[#151515] border border-[#333] flex-shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-multiply"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-heading text-4xl opacity-50 font-bold">
                            {item.title.charAt(0)}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-heading text-lg text-white leading-tight uppercase tracking-wide">{item.title}</h3>
                            <button 
                                onClick={() => removeItem(item.id)}
                                className="text-gray-600 hover:text-red-500 transition-colors -mt-1"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <p className="text-[10px] text-primary/80 font-mono tracking-widest mt-1 uppercase">{item.subtitle || "Standard Edition"}</p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-[#333] bg-[#0a0a0a]">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-[#222] text-gray-400 transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-8 text-center text-xs font-mono text-white border-x border-[#333] h-8 flex items-center justify-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-[#222] text-gray-400 transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <p className="font-mono text-sm text-white">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Total */}
            <div className="relative z-10 p-6 border-t border-[#333] bg-[#111] space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                {/* Receipt Style Details */}
                <div className="space-y-2 text-xs font-mono text-gray-500 border-b border-dashed border-[#333] pb-4">
                    <div className="flex justify-between">
                        <span className="uppercase">Subtotal</span>
                        <span className="text-white">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="uppercase">Tax (Est.)</span>
                        <span className="text-white">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="uppercase">Shipping</span>
                        <span className="text-white">TBD</span>
                    </div>
                </div>

                <div className="flex justify-between items-end pt-2">
                    <div className="flex flex-col">
                        <span className="font-heading text-lg text-white uppercase">Total Due</span>
                        <span className="text-[10px] text-gray-500 font-mono">USD CURRENCY</span>
                    </div>
                    <span className="font-heading text-4xl text-primary tracking-tighter">${cartTotal.toFixed(2)}</span>
                </div>

                <Button 
                    disabled={items.length === 0}
                    className="w-full bg-primary hover:bg-white hover:text-black text-white font-heading text-xl py-8 rounded-none tracking-[0.2em] uppercase transition-all border border-transparent hover:border-black mt-4"
                >
                    Checkout
                </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
