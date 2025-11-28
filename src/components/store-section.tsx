"use client";

import { motion } from "framer-motion";
import { useCart } from "@/context/cart-context";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  difficulty: number;
  age: string;
  category: string;
  color: string;
  accent: string;
  image_url?: string;
}

export function StoreSection() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(4);
        
        if (!error && data) {
          setProducts(data.map((p: any) => ({
            id: p.id,
            title: p.title,
            subtitle: p.subtitle || "",
            price: p.price,
            difficulty: p.difficulty || 1,
            age: p.age || "All Ages",
            category: p.category,
            color: p.color || "bg-gray-800",
            accent: p.accent || "bg-blue-500",
            image_url: p.image_url
          })));
        }
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="w-full relative">
      {/* Decorative Section Header */}
      <div className="flex items-end justify-between mb-8">
        <div className="flex items-center gap-4">
            <div className="h-8 w-4 bg-primary"></div>
            <div>
                <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tighter text-white leading-none">
                POPULAR TODAY
                </h2>
                <span className="font-sans text-[10px] text-gray-500 tracking-[0.3em] uppercase block mt-1">
                    Trending • Global Net
                </span>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="hidden md:block font-sans text-[10px] text-gray-600 uppercase tracking-widest">
                Displaying: 001 - 004
            </div>
            <Link href="/store" className="flex items-center gap-2 text-xs font-mono text-primary hover:text-white uppercase tracking-widest transition-colors group">
                View Full Catalog <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
      </div>

      {/* Compact Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-[#222] rounded"></div>
              <div className="mt-3 h-4 bg-[#222] rounded w-2/3 mx-auto"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="font-mono text-sm">No products available yet.</p>
          <Link href="/store" className="text-primary hover:underline text-sm mt-2 inline-block">Check back soon →</Link>
        </div>
      ) : (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
        {products.map((cat, i) => (
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
                <div className="relative aspect-[3/4] w-full bg-[#111] shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-primary/20 border border-[#222] group-hover:border-primary/50 flex flex-col cursor-pointer h-full">
                
                {/* Spine Shadow (Left) */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/60 to-transparent z-20 pointer-events-none"></div>
                
                {/* Cover Top: Visuals */}
                <div className={`flex-1 ${cat.color} relative overflow-hidden`}>
                    {/* Top Strip: Title */}
                    <div className="absolute top-0 left-0 right-0 h-8 bg-black/30 flex items-center justify-center border-b border-black/10 backdrop-blur-sm z-10">
                        <span className="font-heading text-white/90 text-sm tracking-widest uppercase">{cat.subtitle}</span>
                    </div>

                    {/* Abstract Art Area */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="absolute inset-0 opacity-30" 
                            style={{ backgroundImage: `radial-gradient(circle at 50% 50%, transparent 20%, #000 120%)` }}></div>
                        <div className={`w-16 h-16 rounded-full border-[2px] border-white/20 flex items-center justify-center relative z-10`}>
                            <div className={`w-10 h-10 bg-white/10 rounded-full backdrop-blur-md`}></div>
                        </div>
                        {/* Dither Pattern */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-multiply"></div>
                    </div>

                    {/* Quick Add Button Overlay (Inside Image Container) */}
                    <button 
                        onClick={(e) => {
                            e.preventDefault(); // Prevent navigation
                            addItem({ id: cat.id, title: cat.title, price: cat.price, subtitle: cat.subtitle });
                        }}
                        className="absolute top-0 right-0 w-10 h-10 bg-primary text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-30 hover:bg-white hover:text-primary shadow-lg border-l border-b border-black/20"
                    >
                        <Plus size={20} strokeWidth={3} />
                    </button>
                </div>
                    
                {/* Cover Bottom: Data Block */}
                <div className="bg-[#0a0a0a] p-3 border-t border-[#333] flex flex-col justify-center relative z-10">
                    {/* Price & Difficulty */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 line-through text-[10px] font-mono">${cat.price.toFixed(2)}</span>
                            <span className="font-heading text-white text-lg tracking-tight">${(cat.price * 0.7).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                            <div className="flex gap-[2px]">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`w-1 h-1.5 rounded-[1px] ${i < cat.difficulty ? 'bg-primary' : 'bg-[#222]'}`}></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Age & Vol */}
                    <div className="flex items-center justify-between border-t border-[#222] pt-2">
                        <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">{cat.age}</span>
                        <span className="text-[9px] text-gray-600 font-mono">VOL. {String(i + 1).padStart(3, '0')}</span>
                    </div>
                </div>
                </div>
            </Link>

            {/* Title Below */}
            <div className="mt-3 text-center">
              <h3 className="font-heading text-base text-white uppercase tracking-wide group-hover:text-primary transition-colors">
                {cat.title}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </section>
  );
}
