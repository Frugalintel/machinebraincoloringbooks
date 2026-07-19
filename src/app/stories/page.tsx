"use client";

import { Lock, BookOpen, Clock, ArrowRight, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Story, UserStoryProgress, StoryRequirement } from "@/lib/types";
import { CodeEntry } from "@/components/code-entry";
import { logger } from "@/lib/logger";
import {
  getStoryTheme,
  getStoryCoverImage,
  ADVENTURES_COPY,
} from "@/lib/story-utils";

export default function StoriesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [userProgress, setUserProgress] = useState<UserStoryProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [productIds, setProductIds] = useState<Record<string, string>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (isAuthLoading || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchAllData = async () => {
      try {
        const { data: storyData } = await supabase
          .from("stories")
          .select("*")
          .eq("is_published", true)
          .order("created_at", { ascending: true });

        if (storyData) {
          const uniqueStories = Array.from(
            new Map(storyData.map((s) => [s.id, s])).values(),
          );
          setStories(uniqueStories as Story[]);

          const reqProductNames = storyData
            .map(
              (s: Story) =>
                s.requirements?.find(
                  (r: StoryRequirement) => r.type === "product",
                )?.name,
            )
            .filter(Boolean);

          if (reqProductNames.length > 0) {
            const { data: prodData } = await supabase
              .from("products")
              .select("id, title")
              .in("title", reqProductNames);

            if (prodData) {
              const map: Record<string, string> = {};
              prodData.forEach(
                (p: { title: string; id: string }) => (map[p.title] = p.id),
              );
              setProductIds(map);
            }
          }
        }

        if (user?.id) {
          const { data: progData } = await supabase
            .from("user_story_progress")
            .select("*")
            .eq("user_id", user.id);

          if (progData) {
            setUserProgress(progData as UserStoryProgress[]);
          }
        }
      } catch (error) {
        logger.error("Error loading stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [isAuthLoading, user?.id]);

  useEffect(() => {
    const handleStoryUnlocked = () => {
      if (user?.id) {
        supabase
          .from("user_story_progress")
          .select("*")
          .eq("user_id", user.id)
          .then(({ data }) => {
            if (data) setUserProgress(data as UserStoryProgress[]);
          });
      }
    };
    window.addEventListener("story-unlocked", handleStoryUnlocked);
    return () =>
      window.removeEventListener("story-unlocked", handleStoryUnlocked);
  }, [user?.id]);

  const isStoryUnlocked = (storyId: string) => {
    const story = stories.find((s) => s.id === storyId);
    if (!story) return false;
    const hasRequirements = story.requirements && story.requirements.length > 0;
    const hasCodeNeeded = story.code_needed && story.code_needed.trim() !== "";
    if (!hasRequirements && !hasCodeNeeded) return true;
    return userProgress.some((p) => p.story_id === storyId);
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-black">
      {/* Header */}
      <div className="bg-[#111] border-b border-[#333] py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4 text-primary font-mono uppercase tracking-widest text-xs">
                <BookOpen size={14} />
                <span>{ADVENTURES_COPY.pillarName}</span>
              </div>
              <h1 className="font-heading text-5xl md:text-7xl font-bold text-white mb-4 uppercase tracking-tighter">
                Adventures
              </h1>
              <p className="font-mono text-sm text-gray-500 tracking-widest uppercase max-w-md">
                {ADVENTURES_COPY.pillarTagline}
              </p>
            </div>

            <div className="w-full md:w-auto md:min-w-[380px]">
              <p className="text-[11px] font-medium text-white/30 mb-3 uppercase tracking-wider">
                {ADVENTURES_COPY.codePrompt}
              </p>
              <CodeEntry />
            </div>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="container mx-auto px-4 md:px-6 py-16">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {stories.map((story, index) => {
              const unlocked = isStoryUnlocked(story.id);
              const theme = getStoryTheme(story.title);
              const coverImage = getStoryCoverImage(story);
              const isHovered = hoveredId === story.id;
              const requiredProduct = story.requirements?.find(
                (r: StoryRequirement) => r.type === "product",
              )?.name;
              const requiredProductId = requiredProduct
                ? productIds[requiredProduct]
                : null;

              return (
                <div
                  key={story.id}
                  className="group relative"
                  onMouseEnter={() => setHoveredId(story.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    animationDelay: `${index * 80}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  {/* Card */}
                  <div
                    className={`
                      relative overflow-hidden rounded-sm bg-[#0a0a0a] 
                      border border-white/10
                      transition-all duration-500 ease-out
                      ${isHovered ? "border-white/20 -translate-y-1" : "translate-y-0"}
                      ${!unlocked ? "opacity-50 hover:opacity-70" : ""}
                    `}
                    style={{
                      boxShadow: isHovered
                        ? "0 20px 40px -15px rgba(0,0,0,0.5)"
                        : "0 4px 20px -5px rgba(0,0,0,0.3)",
                    }}
                  >
                    {/* Image Section */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {coverImage ? (
                        <>
                          <img
                            src={coverImage}
                            alt={story.title}
                            className={`
                              absolute inset-0 w-full h-full object-cover
                              transition-all duration-700 ease-out
                              ${isHovered ? "scale-110 brightness-110" : "scale-100 brightness-75 saturate-50"}
                            `}
                          />
                          {/* Gradient Overlay */}
                          <div
                            className={`
                            absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent
                            transition-opacity duration-500
                            ${isHovered ? "opacity-70" : "opacity-90"}
                          `}
                          />
                          {/* Accent Gradient */}
                          <div
                            className={`
                            absolute inset-0 bg-gradient-to-br ${theme.gradient}
                            transition-opacity duration-500
                            ${isHovered ? "opacity-100" : "opacity-0"}
                          `}
                          />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                        <span
                          className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-sm backdrop-blur-md border shadow-sm
                          ${theme.bgAccentLight} ${theme.textAccent} ${theme.borderAccent}/30 border
                        `}
                        >
                          {ADVENTURES_COPY.badge}
                        </span>

                        {unlocked ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                              {ADVENTURES_COPY.unlockedLabel}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                            <Lock size={10} className="text-white/40" />
                            <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
                              {ADVENTURES_COPY.lockedLabel}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Title Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                        <h3
                          className={`
                          font-heading text-3xl md:text-4xl font-bold text-white uppercase tracking-tight leading-none
                          transition-transform duration-500 ease-out
                          ${isHovered ? "translate-y-0" : "translate-y-1"}
                        `}
                        >
                          {story.title}
                        </h3>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 space-y-4">
                      {/* Meta Row */}
                      <div className="flex items-center gap-4 text-white/30">
                        {story.estimated_minutes ? (
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            <span className="text-[11px] font-medium">
                              {story.estimated_minutes} min
                            </span>
                          </div>
                        ) : null}
                        {story.difficulty ? (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  i < story.difficulty!
                                    ? "bg-white/50"
                                    : "bg-white/10"
                                }`}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {/* Synopsis */}
                      <p className="text-sm text-white/50 leading-relaxed line-clamp-2">
                        {story.synopsis}
                      </p>

                      {/* Action Button */}
                      <div
                        className={`
                        transition-all duration-500 ease-out
                        ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
                      `}
                      >
                        {unlocked ? (
                          <Link href={`/stories/${story.id}`}>
                            <Button
                              className={`w-full h-11 ${theme.bgAccent} text-black hover:opacity-90 font-medium text-sm rounded-sm transition-all`}
                            >
                              <BookOpen size={14} className="mr-2" />
                              Start Reading
                              <ArrowRight size={14} className="ml-auto" />
                            </Button>
                          </Link>
                        ) : requiredProductId ? (
                          <Link href={`/store/${requiredProductId}`}>
                            <Button className="w-full h-11 bg-white/10 text-white hover:bg-white/20 font-medium text-sm rounded-sm border border-white/10 transition-all">
                              <ShoppingCart size={14} className="mr-2" />
                              Get the Book
                              <ArrowRight size={14} className="ml-auto" />
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            disabled
                            className="w-full h-11 bg-white/5 text-white/30 font-medium text-sm rounded-sm cursor-not-allowed"
                          >
                            <Lock size={14} className="mr-2" />
                            Code Required
                          </Button>
                        )}
                      </div>

                      {/* Always visible hint for locked */}
                      {!unlocked && !isHovered && (
                        <p className="text-xs text-white/30 text-center">
                          Hover for options
                        </p>
                      )}
                    </div>
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
