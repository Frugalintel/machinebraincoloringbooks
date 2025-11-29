"use client";

import { motion } from "framer-motion";
import { ArrowDown, Star, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { useSettings } from "@/context/settings-context";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";

export function Hero() {
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const { campaign } = useSettings();

  useEffect(() => {
    const fetchFeatured = async () => {
      // 1. Check if campaign has a specific featured product
      if (campaign.isActive && campaign.featuredProductId) {
          const { data } = await supabase
            .from('products')
            .select('*')
            .eq('id', campaign.featuredProductId)
            .single();
          
          if (data) {
              setFeaturedProduct(data);
              return;
          }
      }

      // 2. Fallback: Fetch the Holiday product (or fallback to newest)
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'HOLIDAY')
        .limit(1)
        .single();
      
      if (data) {
        setFeaturedProduct(data);
      } else {
         // Fallback to any product if holiday one is missing
         const { data: anyProduct } = await supabase
            .from('products')
            .select('*')
            .limit(1)
            .single();
         if (anyProduct) setFeaturedProduct(anyProduct);
      }
    };
    fetchFeatured();
  }, [campaign.isActive, campaign.featuredProductId]);

  const productLink = featuredProduct ? `/store/${featuredProduct.id}` : "/store";
  const originalPrice = featuredProduct?.price || 15;
  
  let finalPrice = originalPrice;
  const isDiscountEnabled = campaign.isActive && campaign.discount.enabled;
  
  if (isDiscountEnabled) {
      if (campaign.discount.type === 'percentage') {
          finalPrice = originalPrice * (1 - campaign.discount.value / 100);
      } else if (campaign.discount.type === 'fixed') {
          finalPrice = Math.max(0, originalPrice - campaign.discount.value);
      }
  }

  // Determine theme or defaults
  const theme = campaign.isActive && campaign.theme ? campaign.theme : CAMPAIGN_TEMPLATES.default;
  const isDefault = theme.id === 'default';

  return (
    <section className="relative w-full border-b border-[#333] bg-[#111]">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[75vh]">
        
        {/* Left: Value Prop & CTA (7 Columns) */}
        <div className="lg:col-span-7 border-r border-[#333] relative p-8 md:p-16 flex flex-col justify-center">
            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-10" 
                style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10"
            >
                {/* Social Proof / Badge */}
                <div className="flex items-center gap-2 mb-6">
                    <div className="flex text-primary">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} fill="currentColor" />
                        ))}
                    </div>
                    <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">Rated 4.9/5 by Collectors</span>
                </div>
                
                <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.9] tracking-tighter uppercase mb-6">
                    {theme.text.heroTitle}<br/>
                    <span className="text-primary">{theme.text.heroSubtitle}</span>
                </h1>
                
                <p className="max-w-lg text-gray-400 font-sans text-lg leading-relaxed mb-8">
                    Celebrate the season with our exclusive holiday coloring collection. The perfect digital detox gift for you and your loved ones featuring festive sci-fi landscapes.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/store">
                        <Button 
                            className="h-14 px-8 bg-primary hover:bg-white hover:text-black text-white font-heading text-xl uppercase tracking-widest rounded-none group"
                        >
                            Shop Collection <ShoppingBag className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                        </Button>
                    </Link>
                    <Link href="/stories">
                        <Button variant="outline" className="h-14 px-8 border-[#333] text-gray-400 hover:text-white hover:border-white font-heading text-xl uppercase tracking-widest rounded-none">
                            Explore Lore
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>

        {/* Right: Product Spotlight (5 Columns) */}
        <div className="lg:col-span-5 bg-[#0a0a0a] flex flex-col relative overflow-hidden items-center justify-center p-12">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
            <div className="absolute inset-0 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            {/* Featured Product Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-full max-w-sm aspect-3/4 perspective-1000 group cursor-pointer"
            >
                <Link href={productLink} className="block w-full h-full">
                    <div className="relative w-full h-full bg-[#111] border border-[#333] shadow-2xl transform group-hover:rotate-y-3 transition-transform duration-500 ease-out preserve-3d">
                        {/* Book Spine Effect */}
                        <div className="absolute -left-4 top-2 bottom-2 w-4 bg-[#0a0a0a] border-l border-y border-[#333] transform -skew-y-6 origin-right"></div>
                        
                        {/* Cover Art */}
                        <div className={`absolute inset-0 ${featuredProduct?.color || 'bg-[#e63946]'} flex flex-col overflow-hidden`}>
                            <div className="absolute inset-0 border-r border-white/10 pointer-events-none z-20"></div>
                            {featuredProduct?.image_url ? (
                                <>
                                  <img src={featuredProduct.image_url} alt={featuredProduct.title} className="absolute inset-0 w-full h-full object-cover opacity-90" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20"></div>
                                </>
                            ) : (
                                <>
                                    <div className="h-16 bg-black/20 flex items-center justify-center border-b border-black/10 backdrop-blur-sm relative z-10">
                                        <span className="font-heading text-white/90 text-2xl tracking-tighter uppercase">{featuredProduct?.subtitle || 'Cosmic Xmas'}</span>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center p-8 relative">
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-multiply"></div>
                                        <div className="w-40 h-40 rounded-full border-4 border-white/20 flex items-center justify-center relative z-10">
                                            <div className="w-24 h-24 bg-white/10 rounded-full backdrop-blur-md flex items-center justify-center">
                                                <Star className="text-white w-12 h-12" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="h-20 bg-black/80 p-4 flex justify-between items-center relative z-20 mt-auto">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{featuredProduct?.category || 'Holiday Edition'}</p>
                                    <p className="text-white font-heading">{featuredProduct?.title || 'Festive Sci-Fi'}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                    {isDiscountEnabled ? (
                                        <>
                                            <span className="text-gray-500 line-through text-sm font-mono">${originalPrice.toFixed(2)}</span>
                                            <span className="font-heading text-white text-2xl tracking-tight">${finalPrice.toFixed(2)}</span>
                                        </>
                                    ) : (
                                        <span className="font-heading text-white text-2xl tracking-tight">${originalPrice.toFixed(2)}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30"></div>
                    </div>
                </Link>

                {/* Floating 'New Release' Tag */}
                {(!isDefault || campaign.isActive) && (
                    <div 
                        className="absolute -top-4 -right-4 bg-primary text-black px-4 py-2 font-heading uppercase tracking-widest text-sm shadow-lg transform rotate-3 border border-white/20 z-40"
                    >
                        {theme.text.heroTag}
                    </div>
                )}
            </motion.div>

            {/* Quick Specs */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                <span>100+ Pages</span>
                <span>•</span>
                <span>Premium Paper</span>
                <span>•</span>
                <span>Free Shipping</span>
            </div>
        </div>

      </div>
      
      {/* Bottom Marquee / Connector */}
      <div className="border-t border-[#333] bg-[#0a0a0a] h-10 flex items-center px-4 justify-between text-[10px] font-mono text-gray-600 uppercase tracking-widest">
          <span className="hidden md:inline">{isDefault ? 'New Arrivals' : `${theme.text.storyTag} Sale: Live Now`}</span>
          <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors animate-bounce">
              <span>View {theme.text.storyTag} Collection</span>
              <ArrowDown size={10} />
          </div>
          <span className="hidden md:inline">Limited {theme.text.storyTag} Stock</span>
      </div>
    </section>
  );
}
