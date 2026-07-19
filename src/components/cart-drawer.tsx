"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface SuggestedProduct {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  subtitle?: string;
}

export function CartDrawer() {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
  } = useCart();
  const [suggestedProducts, setSuggestedProducts] = useState<
    SuggestedProduct[]
  >([]);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen]);

  // Fetch suggested products (random 2 that aren't in cart)
  useEffect(() => {
    if (isCartOpen) {
      const fetchSuggestions = async () => {
        const { data } = await supabase
          .from("products")
          .select("id, title, price, image_url, subtitle")
          .limit(10); // Fetch a few to filter from

        if (data) {
          const cartIds = new Set(items.map((i) => i.id));
          const available = data.filter((p) => !cartIds.has(p.id));
          // Shuffle and take 2
          const shuffled = available
            .sort(() => 0.5 - Math.random())
            .slice(0, 2);
          setSuggestedProducts(shuffled);
        }
      };
      fetchSuggestions();
    }
  }, [isCartOpen, items]); // Re-run if cart items change to update suggestions

  return (
    <AnimatePresence>
      {isCartOpen ? (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[20000]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-[#333] z-[20001] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* Background Pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            ></div>

            {/* Header */}
            <div className="relative z-10 p-6 border-b border-[#333] flex items-center justify-between bg-[#111] shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-heading text-3xl text-white tracking-wide uppercase">
                    CART
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1.5 h-1.5 bg-primary animate-pulse"></div>
                  <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                    {items.length} items
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="group relative p-2 text-gray-400 hover:text-white transition-colors"
              >
                <div className="absolute inset-0 border border-transparent group-hover:border-[#333] transition-colors rotate-45 group-hover:rotate-0 duration-300"></div>
                <X size={24} className="relative z-10" />
              </button>
            </div>

            {/* Items List */}
            <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide overscroll-contain">
              <div className="space-y-4 mb-8">
                {items.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center opacity-60">
                    <div className="w-16 h-16 border border-dashed border-[#333] flex items-center justify-center mb-4 rounded-full relative group">
                      <ShoppingBag
                        size={24}
                        className="text-gray-500 group-hover:text-primary transition-colors"
                      />
                    </div>
                    <p className="font-heading text-xl text-white uppercase tracking-widest mb-1">
                      Your cart is empty
                    </p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="relative group bg-[#111] p-1 border border-[#222] hover:border-primary/50 transition-colors"
                    >
                      <div className="flex gap-4 p-3 bg-[#0f0f0f]">
                        {/* Image Placeholder */}
                        <div className="w-16 h-20 bg-[#151515] border border-[#222] flex-shrink-0 relative overflow-hidden group-hover:border-primary/30 transition-colors">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-20 mix-blend-multiply"></div>
                              <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-heading text-2xl opacity-50 font-bold">
                                {item.title.charAt(0)}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-heading text-base text-white leading-none uppercase tracking-wide group-hover:text-primary transition-colors line-clamp-1">
                                {item.title}
                              </h3>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-gray-600 hover:text-red-500 transition-colors -mt-0.5 hover:bg-[#222] rounded-sm"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <p className="text-[9px] text-gray-500 font-mono tracking-widest mt-1 uppercase line-clamp-1">
                              {item.subtitle || "Standard Edition"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center bg-[#0a0a0a] border border-[#222]">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="w-6 h-6 flex items-center justify-center hover:bg-[#222] text-gray-500 hover:text-white transition-colors"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="w-6 text-center text-[10px] font-mono text-white border-x border-[#222] h-4 flex items-center justify-center leading-none">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="w-6 h-6 flex items-center justify-center hover:bg-[#222] text-gray-500 hover:text-white transition-colors"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                            <p className="font-heading text-base text-white tracking-tight">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Suggestions Section */}
              {suggestedProducts.length > 0 && (
                <div className="pt-6 border-t border-[#222]">
                  <h4 className="font-mono text-[10px] uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full"></span>
                    You might also like
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {suggestedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="group relative bg-[#0f0f0f] border border-[#222] hover:border-gray-600 transition-colors p-2"
                      >
                        <Link
                          href={`/store/${product.id}`}
                          onClick={() => setIsCartOpen(false)}
                          className="block aspect-[3/4] bg-[#151515] mb-2 relative overflow-hidden"
                        >
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#222] text-gray-700 font-heading text-xl">
                              {product.title.charAt(0)}
                            </div>
                          )}
                          {/* Quick Add Overlay */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addItem({
                                id: product.id,
                                title: product.title,
                                price: product.price,
                                subtitle: product.subtitle || "",
                                image: product.image_url,
                              });
                            }}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary"
                          >
                            <Plus size={16} />
                          </button>
                        </Link>
                        <div className="space-y-1">
                          <h5 className="font-heading text-xs text-white uppercase tracking-wide truncate">
                            {product.title}
                          </h5>
                          <p className="font-mono text-[10px] text-gray-500">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Total */}
            <div className="relative z-10 p-6 border-t border-[#333] bg-[#0f0f0f] shrink-0">
              {/* Receipt Style Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-xs font-mono text-gray-500">
                  <span className="uppercase tracking-widest">Subtotal</span>
                  <span className="text-gray-300">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono text-gray-500">
                  <span className="uppercase tracking-widest">Processing</span>
                  <span className="text-gray-300">CALCULATED AT CHECKOUT</span>
                </div>
                <div className="h-px w-full bg-[#222] my-2"></div>
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="font-heading text-xl text-white uppercase tracking-wide">
                      Total
                    </span>
                  </div>
                  <span className="font-heading text-4xl text-primary tracking-tighter leading-none">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                disabled={items.length === 0}
                className="w-full bg-primary text-black hover:bg-white border border-transparent hover:border-primary font-heading text-xl h-14 rounded-none tracking-widest uppercase transition-all group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Proceed to Checkout{" "}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </span>
                <div className="absolute inset-0 bg-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
              </Button>

              <div className="mt-4 flex justify-center gap-4 text-[9px] text-gray-600 font-mono uppercase tracking-widest">
                <span>Secure checkout</span>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
