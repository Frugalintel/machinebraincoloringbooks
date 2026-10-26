"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { cartLineTitle, cartUnitCount, cartUnitLabel } from "@/lib/cart-line";
import { toSentenceCase } from "@/lib/display-text";
import { bookName } from "@/lib/store";
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
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[20000]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-line z-[20001] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col"
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
            <div className="relative z-10 p-6 border-b border-line flex items-center justify-between bg-background shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-heading text-h2 text-cream">CART</h2>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1.5 h-1.5 bg-cream animate-pulse"></div>
                  <p className=" text-fg-muted font-label tracking-widest uppercase">
                    {cartUnitLabel(cartUnitCount(items))}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close cart"
                onClick={() => setIsCartOpen(false)}
                className="hit-44 group relative inline-flex h-11 w-11 items-center justify-center p-2 text-fg-muted hover:text-cream transition-colors"
              >
                <div className="absolute inset-0 border border-transparent group-hover:border-line transition-colors rotate-45 group-hover:rotate-0 duration-300"></div>
                <X size={24} className="relative z-10" />
              </button>
            </div>

            {/* Items List */}
            <div className="cart-scroll relative z-10 flex-1 overflow-y-auto p-6 overscroll-contain">
              <div className="space-y-4 mb-8">
                {items.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center opacity-60">
                    <div className="w-16 h-16 border border-dashed border-line flex items-center justify-center mb-4 rounded-full relative group">
                      <ShoppingBag
                        size={24}
                        className="text-fg-muted group-hover:text-primary transition-colors"
                      />
                    </div>
                    <p className="font-heading text-xl text-cream tracking-widest mb-1">
                      Your cart is empty
                    </p>
                  </div>
                ) : (
                  items.map((item) => {
                    const lineTitle = cartLineTitle(item);
                    return (
                      <div
                        key={item.id}
                        className="relative group bg-background p-1 border border-line hover:border-primary/50 transition-colors"
                      >
                        <div className="flex gap-4 p-3 bg-background">
                          {/* Image Placeholder */}
                          <div className="w-16 h-20 bg-background border border-line flex-shrink-0 relative overflow-hidden group-hover:border-primary/30 transition-colors">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={lineTitle}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                              />
                            ) : (
                              <>
                                <div className="absolute inset-0 flex items-center justify-center text-fg-faint font-heading text-2xl opacity-50 font-bold">
                                  {lineTitle.charAt(0)}
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between py-0.5">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="font-heading text-base text-cream leading-none tracking-wide group-hover:text-primary transition-colors line-clamp-1">
                                  {lineTitle}
                                </h3>
                                <button
                                  type="button"
                                  aria-label={`Remove ${lineTitle}`}
                                  onClick={() => removeItem(item.id)}
                                  className="hit-44 inline-flex h-11 w-11 shrink-0 items-center justify-center text-fg-faint hover:bg-surface-2 hover:text-danger transition-colors rounded-sm"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              {toSentenceCase(item.title) !== lineTitle ? (
                                <p className=" text-fg-muted font-label tracking-widest mt-1 uppercase line-clamp-1">
                                  {toSentenceCase(item.title)}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center bg-background border border-line">
                                <button
                                  type="button"
                                  aria-label={`Decrease quantity of ${lineTitle}`}
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity - 1)
                                  }
                                  className="inline-flex h-11 w-11 items-center justify-center hover:bg-surface-2 text-fg-muted hover:text-cream transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="min-w-11 text-center font-label text-cream border-x border-line h-11 flex items-center justify-center leading-none">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Increase quantity of ${lineTitle}`}
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1)
                                  }
                                  className="inline-flex h-11 w-11 items-center justify-center hover:bg-surface-2 text-fg-muted hover:text-cream transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <p className="font-heading text-base text-cream tracking-tight">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Suggestions Section */}
              {suggestedProducts.length > 0 && (
                <div className="pt-6 border-t border-line">
                  <h4 className="font-label tracking-widest text-fg-muted mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 bg-cream rounded-full"></span>
                    You might also like
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {suggestedProducts.map((product) => {
                      const name = bookName({
                        title: product.title,
                        subtitle: product.subtitle ?? "",
                      });
                      return (
                        <div
                          key={product.id}
                          className="group relative bg-background border border-line hover:border-line-strong transition-colors p-2"
                        >
                          <Link
                            href={`/store/${product.id}`}
                            onClick={() => setIsCartOpen(false)}
                            className="block aspect-[3/4] bg-background mb-2 relative overflow-hidden"
                          >
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={name}
                                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-surface-2 text-fg-faint font-heading text-xl">
                                {name.charAt(0)}
                              </div>
                            )}
                            {/* Quick Add Overlay */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addItem({
                                  id: product.id,
                                  title: name,
                                  price: product.price,
                                  subtitle: product.subtitle || "",
                                  image: product.image_url,
                                });
                              }}
                              className="absolute bottom-0 right-0 w-8 h-8 bg-cream text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cream"
                            >
                              <Plus size={16} />
                            </button>
                          </Link>
                          <div className="space-y-1">
                            <h5 className="font-heading text-xs text-cream tracking-wide truncate">
                              {name}
                            </h5>
                            <p className="font-label text-fg-muted">
                              ${product.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Total */}
            <div className="relative z-10 p-6 border-t border-line bg-background shrink-0">
              {/* Receipt Style Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-xs font-mono text-fg-muted">
                  <span className="uppercase tracking-widest">Subtotal</span>
                  <span className="text-fg-secondary">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono text-fg-muted">
                  <span className="uppercase tracking-widest">Processing</span>
                  <span className="text-fg-secondary">
                    CALCULATED AT CHECKOUT
                  </span>
                </div>
                <div className="h-px w-full bg-surface-2 my-2"></div>
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="font-heading text-xl text-cream tracking-wide">
                      Total
                    </span>
                  </div>
                  <span className="font-heading text-4xl text-cream tracking-tighter leading-none">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                disabled={items.length === 0}
                className="w-full bg-cream text-ink hover:bg-cream border border-transparent hover:border-primary font-heading text-xl h-14 rounded-none tracking-widest transition-all group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Proceed to Checkout{" "}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </span>
                <div className="absolute inset-0 bg-cream transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
              </Button>

              <div className="mt-4 flex justify-center gap-4 text-fg-faint font-label uppercase tracking-widest">
                <span>Secure checkout</span>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
