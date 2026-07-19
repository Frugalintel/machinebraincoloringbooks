"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Lock,
  BookOpen,
  Clock,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useSettings } from "@/context/settings-context";
import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";
import {
  getStoryTheme,
  getStoryCoverImage,
  ADVENTURES_COPY,
  STORY_THEMES,
} from "@/lib/story-utils";

export function StoriesSection() {
  const { user } = useAuth();
  const { addItem, setIsCartOpen } = useCart();
  const { campaign } = useSettings();

  const [activeIndex, setActiveIndex] = useState(0);
  const [stories, setStories] = useState<Story[]>([]);
  const [productMap, setProductMap] = useState<
    Record<string, { id: string; image_url?: string }>
  >({});
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const fetchStories = async () => {
      const { data: storyData } = await supabase
        .from("stories")
        .select("*")
        .eq("is_published", true)
        .limit(3);

      if (storyData) {
        setStories(storyData as Story[]);

        const reqProductNames = storyData
          .map(
            (s) =>
              s.requirements.find(
                (r: { type: string; name?: string }) => r.type === "product",
              )?.name,
          )
          .filter(Boolean);

        if (reqProductNames.length > 0) {
          const { data: prodData } = await supabase
            .from("products")
            .select("id, title, image_url")
            .in("title", reqProductNames);

          if (prodData) {
            const map: Record<string, { id: string; image_url?: string }> = {};
            prodData.forEach(
              (p: { id: string; title: string; image_url?: string }) => {
                map[p.title] = { id: p.id, image_url: p.image_url };
              },
            );
            setProductMap(map);
          }
        }
      }
    };
    fetchStories();
  }, []);

  const handleQuickAdd = (
    e: React.MouseEvent,
    productName: string,
    price: number,
  ) => {
    e.stopPropagation();
    const product = productMap[productName];
    if (!product) return;

    let finalPrice = price;
    if (campaign.isActive && campaign.discount.enabled) {
      if (campaign.discount.type === "percentage") {
        finalPrice = price * (1 - campaign.discount.value / 100);
      } else if (campaign.discount.type === "fixed") {
        finalPrice = Math.max(0, price - campaign.discount.value);
      }
    }

    addItem({
      id: product.id,
      title: "Book",
      subtitle: productName,
      price: finalPrice,
      image: product.image_url,
    });
    setIsCartOpen(true);
  };

  const activeStory = stories[activeIndex];
  const activeTheme = activeStory
    ? getStoryTheme(activeStory.title)
    : STORY_THEMES.default;
  const activeCover = activeStory ? getStoryCoverImage(activeStory) : null;
  const activeProduct = activeStory?.requirements?.find(
    (r) => r.type === "product",
  )?.name;

  return (
    <section className="w-full h-full flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className={`h-8 w-4 ${activeTheme.bgAccent} transition-colors duration-500`}
          />
          <div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-white uppercase">
              {ADVENTURES_COPY.pillarName}
            </h2>
            <p className="text-white/40 text-sm mt-1">
              {ADVENTURES_COPY.pillarTagline}
            </p>
          </div>
        </div>
        <Link
          href="/stories"
          className="hidden md:flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
        >
          View all
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Featured Image */}
        <div
          className={`
            relative overflow-hidden rounded-sm bg-[#0a0a0a] border transition-all duration-500 min-h-[400px]
            ${isHovering ? "border-white/20" : "border-white/10"}
          `}
          style={{
            boxShadow: isHovering
              ? "0 25px 50px -20px rgba(0,0,0,0.6)"
              : "0 10px 30px -10px rgba(0,0,0,0.3)",
          }}
        >
          <AnimatePresence mode="wait">
            {activeCover ? (
              <motion.div
                key={activeStory?.id}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <img
                  src={activeCover}
                  alt={activeStory?.title || "Story"}
                  className={`
                    w-full h-full object-cover transition-all duration-700
                    ${isHovering ? "scale-105 brightness-100" : "scale-100 brightness-75 saturate-50"}
                  `}
                />
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-transparent" />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Content Overlay */}
          <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <AnimatePresence mode="wait">
              {activeStory ? (
                <motion.div
                  key={activeStory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-white/40">
                    {activeStory.estimated_minutes ? (
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span className="text-xs">
                          {activeStory.estimated_minutes} min read
                        </span>
                      </div>
                    ) : null}
                    <div
                      className={`px-2 py-0.5 rounded-sm text-[10px] font-medium uppercase tracking-wider ${activeTheme.bgAccentLight} ${activeTheme.textAccent}`}
                    >
                      {ADVENTURES_COPY.badge}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading text-4xl md:text-5xl font-bold text-white uppercase tracking-tight leading-none">
                    {activeStory.title}
                  </h3>

                  {/* Synopsis */}
                  <p className="text-white/60 text-sm leading-relaxed max-w-md line-clamp-2">
                    {activeStory.synopsis}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    {user ? (
                      <Link href="/stories">
                        <Button
                          className={`h-11 px-6 ${activeTheme.bgAccent} text-black hover:opacity-90 font-medium text-sm rounded-sm transition-all`}
                        >
                          <BookOpen size={14} className="mr-2" />
                          Enter Code
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/stories">
                        <Button className="h-11 px-6 bg-white text-black hover:bg-white/90 font-medium text-sm rounded-sm transition-all">
                          <BookOpen size={14} className="mr-2" />
                          View Adventures
                        </Button>
                      </Link>
                    )}

                    {activeProduct && productMap[activeProduct] ? (
                      <Button
                        variant="outline"
                        onClick={(e) => handleQuickAdd(e, activeProduct, 15.0)}
                        className="h-11 px-4 bg-transparent border-white/20 text-white hover:bg-white/10 font-medium text-sm rounded-sm transition-all"
                      >
                        <ShoppingCart size={14} className="mr-2" />
                        Get Book
                      </Button>
                    ) : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* Story List */}
        <div className="flex flex-col gap-3">
          {stories.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-white/30">
              <div className="w-6 h-6 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
            </div>
          ) : (
            stories.map((story, index) => {
              const theme = getStoryTheme(story.title);
              const coverImage = getStoryCoverImage(story);
              const isActive = index === activeIndex;

              return (
                <button
                  key={story.id}
                  onClick={() => setActiveIndex(index)}
                  className={`
                    group relative w-full text-left p-4 rounded-sm border
                    transition-all duration-300
                    ${
                      isActive
                        ? "bg-white/5 border-white/20"
                        : "bg-transparent border-white/10 hover:bg-white/[0.02] hover:border-white/15"
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-sm overflow-hidden bg-white/5 shrink-0">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={story.title}
                          className={`
                            w-full h-full object-cover transition-all duration-500
                            ${isActive ? "brightness-100 saturate-100" : "brightness-50 saturate-0"}
                          `}
                        />
                      ) : (
                        <div
                          className={`w-full h-full ${theme.bgAccentLight}`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`
                          font-heading text-lg uppercase tracking-tight truncate transition-colors duration-300
                          ${isActive ? theme.textAccent : "text-white"}
                        `}
                        >
                          {story.title}
                        </h4>
                        {!user && (
                          <Lock size={12} className="text-white/20 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-white/40 truncate">
                        {story.synopsis}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div
                      className={`
                      w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                      ${isActive ? `${theme.bgAccent} text-black` : "bg-white/5 text-white/30 group-hover:bg-white/10"}
                    `}
                    >
                      <ChevronRight
                        size={14}
                        className={
                          isActive
                            ? ""
                            : "group-hover:translate-x-0.5 transition-transform"
                        }
                      />
                    </div>
                  </div>

                  {/* Active indicator line */}
                  {isActive ? (
                    <motion.div
                      layoutId="activeIndicator"
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${theme.bgAccent}`}
                    />
                  ) : null}
                </button>
              );
            })
          )}

          {/* Bottom CTA */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-white/60 text-sm">
                  {user
                    ? "Have a code from your book?"
                    : "Get a book to unlock adventures"}
                </p>
                <p className="text-white/30 text-xs">
                  Find it on the back page
                </p>
              </div>
              <Link href="/stories">
                <Button
                  className={`h-10 px-5 ${activeTheme.bgAccent} text-black hover:opacity-90 font-medium text-sm rounded-sm transition-all`}
                >
                  {user ? "Enter Code" : "Browse"}
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
