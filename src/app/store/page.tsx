"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Filter,
  Grid as GridIcon,
  List,
  Star,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useSettings } from "@/context/settings-context";
import { useAuth } from "@/context/auth-context";
import { fetchPublishedProducts, productsOrCatalog } from "@/lib/products";
import { fetchProductRatings } from "@/lib/reviews";
import { categories, type Category } from "@/lib/store-data";
import { Product, ProductRating } from "@/lib/types";
import { logger } from "@/lib/logger";
import { toSentenceCase } from "@/lib/display-text";
import { calculatePrice, formatPrice } from "@/lib/pricing";

export default function StorePage() {
  const [activeCategory, setActiveCategory] = useState<Category>("ALL");
  const [products, setProducts] = useState<Product[]>([]);
  const [ratings, setRatings] = useState<Record<string, ProductRating>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();
  const { globalDiscount } = useSettings();
  const { isLoading: isAuthLoading } = useAuth();

  const fetchProducts = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await fetchPublishedProducts();

      if (fetchError) throw fetchError;

      const next = productsOrCatalog(data);
      setProducts(next);

      if (next.length > 0) {
        const productIds = next.map((p) => p.id);
        const { data: ratingsData } = await fetchProductRatings(productIds);
        if (ratingsData) {
          setRatings(ratingsData);
        }
      }
    } catch (err) {
      logger.error("Error loading products:", err);
      setProducts(productsOrCatalog(null));
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch - wait for auth to stabilize
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

  const retryFetch = () => {
    setLoading(true);
    fetchProducts();
  };

  const filteredProducts = products.filter((p) => {
    if (activeCategory === "ALL") return true;
    return p.category === activeCategory || p.title === activeCategory;
  });

  return (
    <main className="min-h-screen bg-background text-cream font-sans">
      {/* Header Banner */}
      <div className="bg-background border-b border-line py-12 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <ShoppingBag size={14} />
            <span className="font-label tracking-[0.12em]">Store</span>
          </div>
          <h1 className="font-display text-title text-cream mb-4">All Books</h1>
          <p className="font-label max-w-md tracking-[0.08em] text-fg-muted">
            Our complete collection of sci-fi coloring books.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`font-label px-4 py-2 tracking-[0.08em] border transition-all ${
                  activeCategory === cat
                    ? "bg-cream border-cream text-ink"
                    : "bg-transparent border-line text-fg-muted hover:border-cream hover:text-cream"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View Options */}
          <div className="flex items-center gap-4 border-l border-line pl-6 hidden md:flex">
            <div className="flex items-center gap-2 font-label tracking-[0.08em] text-fg-muted">
              <Filter size={14} />
              <span>Sort: Newest</span>
            </div>
            <div className="flex gap-2">
              <button className="p-2 bg-surface-2 text-cream">
                <GridIcon size={16} />
              </button>
              <button className="p-2 border border-line text-fg-muted hover:text-cream">
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error ? (
          <div className="w-full py-12 text-center">
            <p className="text-danger font-mono mb-4">{error}</p>
            <button
              onClick={retryFetch}
              className="px-6 py-2 bg-cream text-ink font-heading font-semibold text-sm tracking-[0.06em] hover:bg-cream transition-colors"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Loading State */}
        {loading && !error ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-surface-2 rounded mb-3"></div>
                <div className="h-4 bg-surface-2 w-2/3 rounded"></div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProducts.map((cat, i) => {
              // Use centralized pricing utility
              const priceInfo = calculatePrice(
                cat,
                globalDiscount?.enabled
                  ? {
                      isActive: true,
                      name: globalDiscount.label,
                      discount: {
                        enabled: true,
                        type: "percentage" as const,
                        value: globalDiscount.percentage,
                        scope: "global" as const,
                      },
                      banner: {
                        enabled: false,
                        text: "",
                        link: "",
                        backgroundColor: "",
                        textColor: "",
                      },
                    }
                  : null,
              );

              return (
                <div
                  key={cat.id}
                  className="group perspective-1000 animate-in fade-in zoom-in-95 duration-300"
                  style={{
                    animationDelay: `${i * 30}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <Link href={`/store/${cat.id}`} className="block">
                    <div className="relative aspect-[3/4] w-full bg-background shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-primary/20 border border-line group-hover:border-primary/50 flex flex-col cursor-pointer">
                      {/* Spine Shadow */}
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-background/60 to-transparent z-20 pointer-events-none"></div>

                      {/* Visuals */}
                      {cat.image_url ? (
                        <div className="flex-1 bg-surface-2 relative overflow-hidden">
                          <img
                            src={cat.image_url}
                            alt={toSentenceCase(cat.title)}
                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
                          {/* Quick Add Button Overlay */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              addItem({
                                id: cat.id,
                                title: cat.title,
                                price: priceInfo.finalPrice,
                                subtitle: cat.subtitle,
                                image: cat.image_url,
                              });
                            }}
                            className="absolute top-0 right-0 w-10 h-10 bg-cream text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-30 hover:bg-cream hover:text-ink shadow-lg border-l border-b border-background/20"
                          >
                            <Plus size={20} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`flex-1 ${cat.color} relative overflow-hidden`}
                        >
                          <div className="absolute top-0 left-0 right-0 h-8 bg-background/40 flex items-center justify-center border-b border-background/10 backdrop-blur-sm z-10">
                            <span className="font-label tracking-[0.08em] text-fg-secondary">
                              {cat.subtitle}
                            </span>
                          </div>
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
                          </div>
                          {/* Quick Add Button Overlay */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              addItem({
                                id: cat.id,
                                title: cat.title,
                                price: priceInfo.finalPrice,
                                subtitle: cat.subtitle,
                                image: cat.image_url,
                              });
                            }}
                            className="absolute top-0 right-0 w-10 h-10 bg-cream text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-30 hover:bg-cream hover:text-ink shadow-lg border-l border-b border-background/20"
                          >
                            <Plus size={20} strokeWidth={3} />
                          </button>
                        </div>
                      )}

                      {/* Data Block */}
                      <div className="h-1/4 bg-background p-3 border-t border-line flex flex-col justify-center gap-2 relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {priceInfo.hasDiscount ? (
                              <>
                                <span className="text-fg-muted line-through font-label">
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
                                  className={`w-1 h-1.5 rounded-[1px] ${i < cat.difficulty ? "bg-cream" : "bg-surface-2"}`}
                                ></div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-line pt-2">
                          <span className="font-label tracking-[0.08em] text-fg-muted">
                            {cat.age}
                          </span>
                          {ratings[cat.id] &&
                          ratings[cat.id].review_count > 0 ? (
                            <div className="flex items-center gap-1">
                              <div className="flex gap-[2px]">
                                {[...Array(5)].map((_, starIdx) => (
                                  <Star
                                    key={starIdx}
                                    size={8}
                                    className={`${starIdx < Math.round(ratings[cat.id].average_rating) ? "fill-primary text-primary" : "fill-transparent text-fg-faint"}`}
                                  />
                                ))}
                              </div>
                              <span className=" text-fg-muted font-label">
                                ({ratings[cat.id].review_count})
                              </span>
                            </div>
                          ) : (
                            <span className="font-label tracking-[0.08em] text-fg-faint">
                              VOL. {String(i + 1).padStart(3, "0")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="mt-3 text-center">
                    <h3 className="font-heading text-h3 text-cream group-hover:text-cream transition-colors">
                      {toSentenceCase(cat.title)}
                    </h3>
                    <p className="font-label mt-1 tracking-[0.08em] text-fg-faint">
                      {cat.category}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
