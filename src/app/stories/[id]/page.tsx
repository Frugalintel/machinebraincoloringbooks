"use client";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, CheckCircle2, Terminal, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Story, StoryNode, UserStoryProgress } from "@/lib/types";

interface Chapter extends StoryNode {
    status: 'locked' | 'active' | 'completed';
    title?: string; // Augmented
    description?: string; // Augmented
}

export default function StoryDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<UserStoryProgress | null>(null);

  const fetchStoryData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
        // 1. Fetch Story
        const { data: storyData, error: storyError } = await supabase
            .from('stories')
            .select('*')
            .eq('id', id)
            .single();
        
        if (storyError || !storyData) {
            console.error("Story fetch error:", storyError);
            setLoading(false);
            return;
        }

        const story = storyData as Story;
        setStory(story);

        // 2. Fetch Progress (if logged in)
        let userProgress: UserStoryProgress | null = null;
        if (user) {
            const { data: progData } = await supabase
                .from('user_story_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('story_id', id)
                .single();
            userProgress = progData as UserStoryProgress;
            setProgress(userProgress);
        }

        // 3. Process Content into Chapters
        const content = story.content || [];
        // Flatten or traverse? For now assume linear or simple list for this UI
        // If it's a tree, this UI might be too simple, but let's try to map it linearly for the sidebar
        // The mock data implied a linear sequence of "Chapters"
        
        const mappedChapters: Chapter[] = content.map((node, index) => {
            // Determine status
            let status: 'locked' | 'active' | 'completed' = 'locked';
            
            // Simple logic: 
            // If completed_nodes includes this id -> completed
            // If current_node_id === this id -> active
            // Else -> locked (unless it's the first one and no progress?)
            
            if (userProgress) {
                if (userProgress.completed_nodes?.includes(node.id)) {
                    status = 'completed';
                } else if (userProgress.current_node_id === node.id) {
                    status = 'active';
                } else if (index === 0 && !userProgress.current_node_id && userProgress.completed_nodes.length === 0) {
                     // Should trigger start?
                     status = 'active';
                } else if (status !== 'completed' && status !== 'active') {
                    // Check if previous node is completed? 
                    // For tree structures this is hard. 
                    // Let's assume if it's in completed_nodes it's done.
                    // If it is the current node it is active.
                    // Otherwise locked.
                    status = 'locked';
                }
            } else {
                // Not logged in or no progress
                // If story requires code, all locked? 
                // If public, maybe first is active?
                if (index === 0 && !story.code_needed && (!story.requirements || story.requirements.length === 0)) {
                    status = 'active';
                }
            }

            return {
                ...node,
                title: `Chapter ${index + 1}`, // Fallback title
                description: node.content.substring(0, 50) + "...",
                status
            };
        });

        setChapters(mappedChapters);
        
        // Set active chapter to current progress or first
        if (userProgress?.current_node_id) {
            setActiveChapterId(userProgress.current_node_id);
        } else if (mappedChapters.length > 0) {
            setActiveChapterId(mappedChapters[0].id);
        }

    } catch (error) {
        console.error("Error loading story details:", error);
    } finally {
        setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchStoryData();
  }, [fetchStoryData]);

  if (loading) {
      return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </main>
      );
  }

  if (!story) {
      return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
            <div className="text-center">
                <h1 className="text-4xl text-primary mb-4">ERROR 404</h1>
                <p className="text-gray-500">STORY FILE NOT FOUND</p>
                <Link href="/stories" className="mt-8 inline-block border-b border-primary text-primary pb-1 hover:text-white transition-colors">
                    RETURN TO ARCHIVES
                </Link>
            </div>
        </main>
      );
  }

  // Find active chapter object
  const currentChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-black flex flex-col">
      <Navbar />
      
      {/* Breadcrumb / Header */}
      <div className="border-b border-[#333] bg-[#0a0a0a] py-6">
          <div className="container mx-auto px-4 md:px-6 flex items-center gap-4 text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-widest">
                <Link href="/stories" className="hover:text-primary flex items-center gap-2 transition-colors">
                    <ArrowLeft size={12} /> ARCHIVES
                </Link>
                <ChevronRight size={10} className="text-[#333]" />
                <span className="text-white hover:text-primary transition-colors cursor-pointer">Story Mode</span>
                <ChevronRight size={10} className="text-[#333]" />
                <span className="text-primary">{story.title}</span>
          </div>
      </div>

      <div className="flex-1 container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 h-full">
            
            {/* Left: Story Tree / Navigation */}
            <div className="lg:col-span-4 flex flex-col gap-8 border-r border-[#333] pr-8">
                <div className="space-y-2">
                    <h1 className="font-heading text-4xl text-white uppercase tracking-wide">{story.title}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 uppercase tracking-widest">
                            Sci-Fi
                        </span>
                        {progress && (
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                Progress: {Math.round((progress.completed_nodes.length / (story.content.length || 1)) * 100)}%
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-6 relative">
                    {/* Vertical Connecting Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-px bg-[#333] -z-10"></div>

                    {chapters.length === 0 ? (
                        <div className="text-gray-500 font-mono text-xs">No chapters found.</div>
                    ) : (
                        chapters.map((chapter) => {
                            const isCompleted = chapter.status === "completed";
                            const isActive = chapter.status === "active";
                            const isLocked = chapter.status === "locked";
                            
                            return (
                                <div 
                                    key={chapter.id}
                                    onClick={() => !isLocked && setActiveChapterId(chapter.id)}
                                    className={`relative pl-12 cursor-pointer group ${isActive ? "opacity-100" : (isLocked ? "opacity-50 cursor-not-allowed" : "opacity-80 hover:opacity-100")}`}
                                >
                                    {/* Node Indicator */}
                                    <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors bg-black z-10
                                        ${isCompleted ? "border-primary text-primary" : (isActive ? "border-white text-white animate-pulse" : "border-[#333] text-gray-600")}
                                    `}>
                                        {isCompleted ? <CheckCircle2 size={18} /> : (isLocked ? <Lock size={16} /> : <span className="font-mono text-xs">{chapter.id.slice(0,2)}</span>)}
                                    </div>

                                    {/* Card Content */}
                                    <div className={`border p-4 transition-all duration-300
                                        ${activeChapterId === chapter.id ? "bg-[#1a1a1a] border-primary/50" : "bg-[#0a0a0a] border-[#333] hover:border-gray-500"}
                                    `}>
                                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono mb-1">{chapter.type || 'Node'}</p>
                                        <h4 className={`font-heading text-lg uppercase mb-2 ${activeChapterId === chapter.id ? "text-white" : "text-gray-400"}`}>
                                            {chapter.title}
                                        </h4>
                                        {isLocked && (
                                            <div className="flex items-center gap-2 text-[10px] text-red-500 font-mono uppercase tracking-widest">
                                                <Lock size={10} /> Locked
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right: Content Viewer */}
            <div className="lg:col-span-8 flex flex-col h-full">
                {currentChapter ? (
                    <div className="border border-[#333] bg-[#0a0a0a] flex-1 flex flex-col relative overflow-hidden shadow-2xl min-h-[500px]">
                        
                        {/* Visual Header */}
                        <div className={`h-64 w-full relative overflow-hidden bg-gradient-to-br from-gray-900 to-black`}>
                            {currentChapter.image_url && (
                                <img src={currentChapter.image_url} alt="Chapter Visual" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                            )}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
                            
                            {/* Overlay Data */}
                            <div className="absolute bottom-6 left-6 right-6">
                                <h2 className="font-heading text-5xl text-white uppercase tracking-wide mb-2">
                                    {currentChapter.title}
                                </h2>
                                <p className="text-gray-300 font-sans max-w-xl text-lg">
                                    {currentChapter.description}
                                </p>
                            </div>
                        </div>

                        {/* Interactive Area */}
                        <div className="p-8 flex-1 flex flex-col">
                            
                            <div className="flex-1 font-mono text-gray-400 text-sm leading-relaxed space-y-4">
                                <p>
                                    <span className="text-primary mr-2">&gt;</span>
                                    {currentChapter.content}
                                </p>
                                {currentChapter.status === "completed" && (
                                    <p className="text-green-500 mt-4">
                                        <span className="mr-2">&gt;</span>
                                        Log Entry Complete.
                                    </p>
                                )}
                            </div>

                            {/* Action Bar */}
                            <div className="mt-8 pt-6 border-t border-[#333] flex justify-between items-center">
                                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                                    Terminal ID: 8821-{currentChapter.id.slice(0,4)}
                                </div>
                                {currentChapter.status === "active" ? (
                                    <Button className="bg-primary text-black hover:bg-white hover:text-black font-heading uppercase tracking-widest px-8">
                                        Enter Input <Terminal size={16} className="ml-2" />
                                    </Button>
                                ) : (
                                    <Button variant="ghost" disabled className="text-gray-600 uppercase tracking-widest font-mono text-xs">
                                        {currentChapter.status === 'completed' ? 'Completed' : 'Locked'}
                                    </Button>
                                )}
                            </div>

                        </div>

                        {/* Scanlines Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-10 pointer-events-none"></div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center border border-[#333] bg-[#0a0a0a] text-gray-600 font-mono text-xs uppercase tracking-widest">
                        No data available
                    </div>
                )}
            </div>

        </div>
      </div>
    </main>
  );
}
