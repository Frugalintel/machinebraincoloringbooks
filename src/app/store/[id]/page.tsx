"use client";

import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Star, Truck, ShieldCheck, Share2 } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";

export default function ProductPage() {
  const { id } = useParams();
  const { addItem, setIsCartOpen } = useCart();
  const router = useRouter();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
        const fetchProduct = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();
            
            if (!error && data) {
                setProduct({
                    ...data,
                    discount_percent: data.discount_percent || 0,
                    is_published: data.is_published,
                    image_url: data.image_url || undefined
                });
            }
            setLoading(false);
        };
        fetchProduct();
    }
  }, [id]);

  if (loading) {
      return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">ACCESSING DATABASE...</p>
          </div>
        </main>
      );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <div className="text-center">
            <h1 className="text-4xl text-primary mb-4">ERROR 404</h1>
            <p className="text-gray-500">ITEM NOT FOUND IN DATABASE</p>
            <Link href="/" className="mt-8 inline-block border-b border-primary text-primary pb-1 hover:text-white transition-colors">
                RETURN TO INDEX
            </Link>
        </div>
      </main>
    );
  }

  const handleAddToCart = () => {
    addItem({ 
        id: product.id, 
        title: product.title, 
        price: product.price, 
        subtitle: product.subtitle || ""
    });
    setIsCartOpen(true);
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <Navbar />
      
      {/* Breadcrumb / Header */}
      <div className="border-b border-[#333] bg-[#0a0a0a] py-4">
          <div className="container mx-auto px-4 md:px-6 flex items-center gap-4 text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-widest">
                <button onClick={() => router.back()} className="hover:text-primary flex items-center gap-2 transition-colors">
                    <ArrowLeft size={12} /> BACK
                </button>
                <span className="text-[#333]">/</span>
                <span className="text-white">{product.title}</span>
                <span className="text-[#333]">/</span>
                <span>Vol. {product.id.slice(0, 3)}</span>
          </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            
            {/* Left: Visuals */}
            <div className="lg:col-span-7">
                <div className="relative aspect-[3/4] md:aspect-square w-full bg-[#111] border border-[#333] p-8 md:p-16 flex items-center justify-center group overflow-hidden">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a1a1a_0%,#000_100%)] opacity-50"></div>
                    
                    {/* Book Mockup - Large */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20, rotateY: -10 }}
                        animate={{ opacity: 1, y: 0, rotateY: 0 }}
                        transition={{ duration: 0.8 }}
                        className="relative w-3/4 md:w-1/2 aspect-[3/4] shadow-2xl perspective-1000"
                        style={{ transformStyle: "preserve-3d" }}
                    >
                         <div className={`absolute inset-0 ${product.color || 'bg-gray-900'} flex flex-col relative overflow-hidden border-r-4 border-black/20`}>
                            {/* Cover Design Reuse */}
                            {product.image_url ? (
                              <div className="absolute inset-0">
                                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                              </div>
                            ) : (
                             <>
                            <div className="absolute top-0 left-0 right-0 h-12 bg-black/30 flex items-center justify-center border-b border-black/10 backdrop-blur-sm z-10">
                                <span className="font-heading text-white/90 text-xl tracking-widest uppercase">{product.subtitle}</span>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <div className={`w-32 h-32 rounded-full border-[4px] border-white/20 flex items-center justify-center relative z-10`}>
                                    <div className={`w-20 h-20 bg-white/10 rounded-full backdrop-blur-md`}></div>
                                </div>
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-multiply"></div>
                            </div>
                            </>
                            )}
                            <div className="absolute bottom-0 w-full bg-black/90 p-4 border-t border-white/10 flex justify-between items-center z-20">
                                <span className="text-xs text-gray-500 font-mono uppercase">Vol. {product.id.slice(0, 3)}</span>
                                <span className="text-xs text-white font-heading tracking-widest uppercase">{product.title}</span>
                            </div>
                         </div>
                         
                         {/* Shadow/Reflection */}
                         <div className="absolute -bottom-8 left-4 right-4 h-4 bg-black/50 blur-xl rounded-[100%]"></div>
                    </motion.div>

                    {/* Zoom/Interaction Hint */}
                    <div className="absolute bottom-4 right-4 text-[10px] font-mono text-gray-600 uppercase tracking-widest border border-[#333] px-2 py-1">
                        Fig 1.1 — Front Cover
                    </div>
                </div>
            </div>

            {/* Right: Details */}
            <div className="lg:col-span-5 flex flex-col h-full">
                <div className="border-b border-[#333] pb-8 mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-8 w-2 bg-primary"></div>
                        <h1 className="font-heading text-5xl md:text-6xl font-bold uppercase leading-none text-white">{product.title}</h1>
                    </div>
                    <h2 className="font-mono text-xl text-gray-400 tracking-widest uppercase mb-6">Subtitle: {product.subtitle}</h2>
                    <p className="text-gray-400 font-sans leading-relaxed text-sm md:text-base max-w-md">
                        {product.description}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <span className="block text-[10px] uppercase tracking-widest text-primary font-mono mb-2">Difficulty Level</span>
                        <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-4 h-2 rounded-[1px] ${i < product.difficulty ? 'bg-white' : 'bg-[#222]'}`}></div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase tracking-widest text-primary font-mono mb-2">Recommended Age</span>
                        <div className="font-heading text-xl text-white uppercase">{product.age}</div>
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase tracking-widest text-primary font-mono mb-2">Format</span>
                        <div className="font-heading text-xl text-white uppercase">Print + Digital</div>
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase tracking-widest text-primary font-mono mb-2">Pages</span>
                        <div className="font-heading text-xl text-white uppercase">96 Pages</div>
                    </div>
                </div>

                <div className="mt-auto bg-[#111] border border-[#333] p-6 md:p-8 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent"></div>
                    
                    <div className="flex justify-between items-end mb-6">
                         <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Black Friday Price</span>
                            <div className="flex items-baseline gap-3">
                                <span className="font-heading text-4xl text-white">${(product.price * 0.7).toFixed(2)}</span>
                                <span className="font-mono text-xl text-gray-600 line-through">${product.price.toFixed(2)}</span>
                            </div>
                         </div>
                         <div className="flex gap-2 text-[10px] font-mono text-green-500 items-center bg-green-900/20 px-2 py-1 border border-green-900/30">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            IN STOCK
                         </div>
                    </div>

                    <Button 
                        onClick={handleAddToCart}
                        className="w-full h-14 bg-primary hover:bg-white hover:text-black text-white font-heading text-xl tracking-[0.2em] rounded-none uppercase transition-all group mb-4"
                    >
                        Add to Requisition <ShoppingCart className="ml-4 w-5 h-5 group-hover:scale-110 transition-transform" />
                    </Button>
                    
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <Truck size={12} /> 
                            <span>Ships Worldwide</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={12} /> 
                            <span>Secure Checkout</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </main>
  );
}

