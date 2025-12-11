"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Filter, Grid as GridIcon, List, Star } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useSettings } from "@/context/settings-context";
import { useAuth } from "@/context/auth-context";
import { fetchPublishedProducts } from "@/lib/products";
import { fetchProductRatings } from "@/lib/reviews";
import { categories, type Category } from "@/lib/store-data";
import { Product, ProductRating } from "@/lib/types";
import { logger } from "@/lib/logger";
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
      
      if (data) {
        setProducts(data);
        
        // Fetch ratings for all products
        const productIds = data.map(p => p.id);
        const { data: ratingsData } = await fetchProductRatings(productIds);
        if (ratingsData) {
          setRatings(ratingsData);
        }
      }
    } catch (err) {
      logger.error("Error loading products:", err);
      setError("Unable to load products. Please try again.");
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
      if (document.visibilityState === 'visible' && products.length === 0) {
        fetchProducts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [products.length]);

  const retryFetch = () => {
    setLoading(true);
    fetchProducts();
  };

  const filteredProducts = products.filter(p => {
      if (activeCategory === "ALL") return true;
      return p.category === activeCategory || p.title === activeCategory;
  });

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      
      {/* Header Banner */}
      <div className="bg-[#111] border-b border-[#333] py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
          <div className="container mx-auto px-4 md:px-6 relative z-10">
              <h1 className="font-heading text-6xl md:text-8xl font-bold text-white mb-4 uppercase tracking-tighter">
                  Full Catalog
              </h1>
              <p className="font-mono text-sm text-gray-500 tracking-widest uppercase max-w-md">
                  Index of all available neural-generated coloring books and visual artifacts.
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
                        className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-all ${
                            activeCategory === cat 
                            ? (cat === "HOLIDAY" ? "bg-red-600 border-red-600 text-white font-bold" : "bg-primary border-primary text-black font-bold") 
                            : (cat === "HOLIDAY" ? "bg-transparent border-red-900/50 text-red-500 hover:border-red-500 hover:text-white" : "bg-transparent border-[#333] text-gray-500 hover:border-white hover:text-white")
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            
            {/* View Options */}
            <div className="flex items-center gap-4 border-l border-[#333] pl-6 hidden md:flex">
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-widest">
                    <Filter size={14} /> 
                    <span>Sort: Newest</span>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 bg-[#222] text-white"><GridIcon size={16} /></button>
                    <button className="p-2 border border-[#333] text-gray-500 hover:text-white"><List size={16} /></button>
                </div>
            </div>
        </div>

        {/* Error State */}
        {error ? <div className="w-full py-12 text-center">
                <p className="text-red-500 font-mono mb-4">{error}</p>
                <button 
                    onClick={retryFetch}
                    className="px-6 py-2 bg-primary text-black font-bold uppercase tracking-widest hover:bg-white transition-colors"
                >
                    Retry
                </button>
            </div> : null}

        {/* Loading State */}
        {loading && !error ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="aspect-[3/4] bg-[#222] rounded mb-3"></div>
                        <div className="h-4 bg-[#222] w-2/3 rounded"></div>
                    </div>
                ))}
            </div> : null}

        {/* Grid */}
        {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProducts.map((cat, i) => {
                // Use centralized pricing utility
                const priceInfo = calculatePrice(cat, globalDiscount?.enabled ? { 
                    isActive: true, 
                    name: globalDiscount.label,
                    discount: { enabled: true, type: 'percentage' as const, value: globalDiscount.percentage, scope: 'global' as const },
                    banner: { enabled: false, text: '', link: '', backgroundColor: '', textColor: '' }
                } : null);

                return (
                <div
                    key={cat.id}
                    className="group perspective-1000 animate-in fade-in zoom-in-95 duration-300"
                    style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'backwards' }}
                >
                    <Link href={`/store/${cat.id}`} className="block">
                        <div className="relative aspect-[3/4] w-full bg-[#111] shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-primary/20 border border-[#222] group-hover:border-primary/50 flex flex-col cursor-pointer">
                            
                            {/* Spine Shadow */}
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/60 to-transparent z-20 pointer-events-none"></div>
                            
                            {/* Visuals */}
                            {cat.image_url ? (
                                <div className="flex-1 bg-[#222] relative overflow-hidden">
                                     <img src={cat.image_url} alt={cat.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                     {/* Quick Add Button Overlay */}
                                     <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            addItem({ 
                                                id: cat.id, 
                                                title: cat.title, 
                                                price: priceInfo.finalPrice, 
                                                subtitle: cat.subtitle,
                                                image: cat.image_url 
                                            });
                                        }}
                                        className="absolute top-0 right-0 w-10 h-10 bg-primary text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-30 hover:bg-white hover:text-primary shadow-lg border-l border-b border-black/20"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                    </button>
                                </div>
                            ) : (
                                <div className={`flex-1 ${cat.color} relative overflow-hidden`}>
                                    <div className="absolute top-0 left-0 right-0 h-8 bg-black/30 flex items-center justify-center border-b border-black/10 backdrop-blur-sm z-10">
                                        <span className="font-heading text-white/90 text-sm tracking-widest uppercase">{cat.subtitle}</span>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center p-4">
                                        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, transparent 20%, #000 120%)` }}></div>
                                        <div className={`w-16 h-16 rounded-full border-[2px] border-white/20 flex items-center justify-center relative z-10`}>
                                            <div className={`w-10 h-10 bg-white/10 rounded-full backdrop-blur-md`}></div>
                                        </div>
                                        <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-40 mix-blend-multiply"></div>
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
                                                image: cat.image_url 
                                            });
                                        }}
                                        className="absolute top-0 right-0 w-10 h-10 bg-primary text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-30 hover:bg-white hover:text-primary shadow-lg border-l border-b border-black/20"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                    </button>
                                </div>
                            )}

                            {/* Data Block */}
                            <div className="h-1/4 bg-[#0a0a0a] p-3 border-t border-[#333] flex flex-col justify-center gap-2 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {priceInfo.hasDiscount ? (
                                            <>
                                                <span className="text-gray-500 line-through text-[10px] font-mono">{formatPrice(priceInfo.originalPrice)}</span>
                                                <span className="font-heading text-white text-lg tracking-tight">{formatPrice(priceInfo.finalPrice)}</span>
                                            </>
                                        ) : (
                                            <span className="font-heading text-white text-lg tracking-tight">{formatPrice(priceInfo.originalPrice)}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        <div className="flex gap-[2px]">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className={`w-1 h-1.5 rounded-[1px] ${i < cat.difficulty ? 'bg-primary' : 'bg-[#222]'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-[#222] pt-2">
                                    <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">{cat.age}</span>
                                    {ratings[cat.id] && ratings[cat.id].review_count > 0 ? (
                                        <div className="flex items-center gap-1">
                                            <div className="flex gap-[2px]">
                                                {[...Array(5)].map((_, starIdx) => (
                                                    <Star 
                                                        key={starIdx} 
                                                        size={8} 
                                                        className={`${starIdx < Math.round(ratings[cat.id].average_rating) ? 'fill-primary text-primary' : 'fill-transparent text-[#333]'}`} 
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[8px] text-gray-500 font-mono">({ratings[cat.id].review_count})</span>
                                        </div>
                                    ) : (
                                        <span className="text-[9px] text-gray-600 font-mono">VOL. {String(i + 1).padStart(3, '0')}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>

                    <div className="mt-3 text-center">
                        <h3 className="font-heading text-base text-white uppercase tracking-wide group-hover:text-primary transition-colors">
                            {cat.title}
                        </h3>
                        <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mt-1">{cat.category}</p>
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
