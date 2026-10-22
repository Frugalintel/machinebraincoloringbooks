"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/context/cart-context";
import { useSettings } from "@/context/settings-context";
import { useAuth } from "@/context/auth-context";
import { fetchPublishedProducts, productsOrCatalog } from "@/lib/products";
import { Product } from "@/lib/types";
import { logger } from "@/lib/logger";
import { calculatePrice, formatPrice } from "@/lib/pricing";

export function StoreSection() {
  const { addItem } = useCart();
  const { campaign } = useSettings();
  const { isLoading: isAuthLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data, error } = await fetchPublishedProducts(4);

      setProducts(productsOrCatalog(!error ? data : null, 4));
    } catch (error) {
      logger.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch - wait for auth
  useEffect(() => {
    if (!isAuthLoading) {
      fetchProducts();
    }
  }, [isAuthLoading]);

  // Refetch when tab becomes visible (handles mobile tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && products.length === 0) {
        fetchProducts();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [products.length]);

  return (
    <section id="store-section" className="w-full relative scroll-mt-4">
      {/* Decorative Section Header */}
      <div className="flex items-end justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-8 w-4 bg-primary"></div>
          <div>
            <h2 className="font-heading text-h2 text-cream">Books</h2>
            <span className="font-label mt-1 block tracking-[0.08em] text-fg-muted">
              Our latest releases
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/store"
            className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.04em] text-primary hover:text-cream transition-colors group"
          >
            See all books{" "}
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>

      {/* Compact Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-surface-2 rounded"></div>
              <div className="mt-3 h-4 bg-surface-2 rounded w-2/3 mx-auto"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-fg-muted">
          <p className="font-mono text-sm">No products available yet.</p>
          <Link
            href="/store"
            className="text-primary hover:underline text-sm mt-2 inline-block"
          >
            Check back soon →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
          {products.map((cat, i) => {
            // Use centralized pricing utility
            const priceInfo = calculatePrice(
              cat,
              campaign?.isActive ? campaign : null,
            );

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="group perspective-1000"
              >
                <Link href={`/store/${cat.id}`} className="block h-full">
                  {/* Compact Book Cover Mockup */}
                  <div className="relative aspect-[3/4] w-full bg-background shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-primary/20 border border-line group-hover:border-primary/50 flex flex-col cursor-pointer h-full">
                    {/* Spine Shadow (Left) */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-background/60 to-transparent z-20 pointer-events-none"></div>

                    {/* Cover Top: Visuals */}
                    <div
                      className={`flex-1 ${cat.color} relative overflow-hidden`}
                    >
                      {/* Top Strip: Title */}
                      <div className="absolute top-0 left-0 right-0 h-8 bg-background/40 flex items-center justify-center border-b border-background/10 backdrop-blur-sm z-10">
                        <span className="font-label tracking-[0.08em] text-fg-secondary">
                          {cat.subtitle}
                        </span>
                      </div>

                      {/* Abstract Art Area */}
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div
                          className="absolute inset-0 opacity-30"
                          style={{
                            backgroundImage: `radial-gradient(circle at 50% 50%, transparent 20%, var(--base) 120%)`,
                          }}
                        ></div>
                        <div
                          className={`w-16 h-16 rounded-full border-[2px] border-cream/20 flex items-center justify-center relative z-10`}
                        >
                          <div
                            className={`w-10 h-10 bg-cream/10 rounded-full backdrop-blur-md`}
                          ></div>
                        </div>
                        {/* Dither Pattern */}
                        <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-40 mix-blend-multiply"></div>
                      </div>

                      {/* Quick Add Button Overlay (Inside Image Container) */}
                      <button
                        onClick={(e) => {
                          e.preventDefault(); // Prevent navigation
                          addItem({
                            id: cat.id,
                            title: cat.title,
                            price: priceInfo.finalPrice,
                            subtitle: cat.subtitle,
                            image: cat.image_url,
                          });
                        }}
                        className="absolute top-0 right-0 w-10 h-10 bg-primary text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-30 hover:bg-cream hover:text-ink shadow-lg border-l border-b border-background/20"
                      >
                        <Plus size={20} strokeWidth={3} />
                      </button>
                    </div>

                    {/* Cover Bottom: Data Block */}
                    <div className="bg-background p-3 border-t border-line flex flex-col justify-center relative z-10">
                      {/* Price & Difficulty */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {priceInfo.hasDiscount ? (
                            <>
                              <span className="text-fg-muted line-through text-[10px] font-mono">
                                {formatPrice(priceInfo.originalPrice)}
                              </span>
                              <span className="price text-cream text-[18px] md:text-[22px]">
                                {formatPrice(priceInfo.finalPrice)}
                              </span>
                            </>
                          ) : (
                            <span className="price text-cream text-[18px] md:text-[22px]">
                              {formatPrice(priceInfo.originalPrice)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex gap-[2px]">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-1 h-1.5 rounded-[1px] ${i < cat.difficulty ? "bg-primary" : "bg-surface-2"}`}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Age & Vol */}
                      <div className="flex items-center justify-between border-t border-line pt-2">
                        <span className="font-label tracking-[0.08em] text-fg-muted">
                          {cat.age}
                        </span>
                        <span className="font-label tracking-[0.08em] text-fg-faint">
                          VOL. {String(i + 1).padStart(3, "0")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Title Below */}
                <div className="mt-3 text-center">
                  <h3 className="font-heading text-h3 text-cream group-hover:text-primary transition-colors">
                    {cat.title}
                  </h3>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
