"use client";

import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { useSettings } from "@/context/settings-context";
import { Plus, Filter, Grid as GridIcon, List } from "lucide-react";
import { categories, type Category, type Product } from "@/lib/store-data";
import { supabase } from "@/lib/supabase";

export default function StorePage() {
  const [activeCategory, setActiveCategory] = useState<Category>("ALL");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { globalDiscount } = useSettings();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            const dbProducts: Product[] = data.map((p: any) => ({
                id: p.id,
                title: p.title,
                subtitle: p.subtitle || "",
                price: p.price,
                difficulty: p.difficulty || 1,
                age: p.age || "All Ages",
                category: p.category,
                color: p.color || "bg-gray-800",
                accent: p.accent || "bg-blue-500",
                description: p.description || "",
                image_url: p.image_url,
                is_published: p.is_published
            }));
            setProducts(dbProducts);
        }
    } catch (error) {
        console.error("Error loading products:", error);
    } finally {
        setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
      if (activeCategory === "ALL") return true;
      return p.category === activeCategory || p.title === activeCategory;
  });

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <Navbar />
      
      {/* Header Banner */}
      <div className="bg-[#111] border-b border-[#333] py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
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

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProducts.map((cat, i) => {
                const finalPrice = globalDiscount.enabled 
                    ? cat.price * (1 - globalDiscount.percentage / 100) 
                    : cat.price;

                return (
                <motion.div
                    layout
                    key={cat.id} // Use ID as key (can be string or number)
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="group perspective-1000"
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
                                            addItem({ id: cat.id, title: cat.title, price: finalPrice, subtitle: cat.subtitle });
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
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-multiply"></div>
                                    </div>
                                    {/* Quick Add Button Overlay */}
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            addItem({ id: cat.id, title: cat.title, price: finalPrice, subtitle: cat.subtitle });
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
                                        {globalDiscount.enabled ? (
                                            <>
                                                <span className="text-gray-500 line-through text-[10px] font-mono">${cat.price.toFixed(2)}</span>
                                                <span className="font-heading text-white text-lg tracking-tight">${finalPrice.toFixed(2)}</span>
                                            </>
                                        ) : (
                                            <span className="font-heading text-white text-lg tracking-tight">${cat.price.toFixed(2)}</span>
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
                                    <span className="text-[9px] text-gray-600 font-mono">VOL. {String(i + 1).padStart(3, '0')}</span>
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
                </motion.div>
                );
            })}
        </div>
      </div>
    </main>
  );
}
