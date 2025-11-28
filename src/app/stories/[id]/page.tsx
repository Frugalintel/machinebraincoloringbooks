"use client";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Trophy, Play, CheckCircle2, Circle, Shield, Terminal, Hash, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";

// Mock Data for a specific story
const storyData = {
    id: "story-01",
    title: "The Signal",
    genre: "Sci-Fi",
    status: "unlocked",
    progress: 1, 
    description: "Sector 7 • Transmission received • Awaiting input",
    initialArtifact: "Vacuum Pups",
    initialArtifactId: 1,
    chapters: [
        {
            id: 1,
            title: "Origin Point",
            type: "Initialization",
            description: "A strange binary code has appeared in the static of Sector 7. It's calling out to... something.",
            requirement: "Code: DOG",
            status: "completed",
            content: "The signal resolves into a coherent pattern. It's not just static; it's a map. Coordinates point to an abandoned orbital station.",
            image: "bg-gradient-to-br from-blue-900 to-black"
        },
        {
            id: 2,
            title: "Orbital Approach",
            type: "Branch A",
            description: "The shuttle docks. The airlock hisses open. Darkness awaits.",
            requirement: "Requires: Star Drifter",
            status: "active",
            content: "??? [Encrypted Data]",
            image: "bg-black"
        },
        {
            id: 3,
            title: "The Core",
            type: "Branch B",
            description: "Deep within the station, a light pulses. Is it a friend or foe?",
            requirement: "Requires: Iron Giant",
            status: "locked",
            content: "??? [Encrypted Data]",
            image: "bg-black"
        }
    ]
};

export default function StoryDetailPage() {
  const { id } = useParams();
  const { user, openAuthModal } = useAuth();
  const [activeChapter, setActiveChapter] = useState(1); // Default to first chapter or current progress

  // Mock: If ID doesn't match, just show the mock story for demo
  const story = storyData;

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-black flex flex-col">
      <Navbar />
      
      {/* Breadcrumb / Header */}
      <div className="border-b border-[#333] bg-[#0a0a0a] pt-32 pb-6">
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
                            {story.genre}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                            Progress: 33%
                        </span>
                    </div>
                </div>

                <div className="space-y-6 relative">
                    {/* Vertical Connecting Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-px bg-[#333] -z-10"></div>

                    {story.chapters.map((chapter, index) => {
                        const isCompleted = chapter.status === "completed";
                        const isActive = chapter.status === "active";
                        const isLocked = chapter.status === "locked";
                        
                        return (
                            <div 
                                key={chapter.id}
                                onClick={() => !isLocked && setActiveChapter(chapter.id)}
                                className={`relative pl-12 cursor-pointer group ${isActive ? "opacity-100" : (isLocked ? "opacity-50 cursor-not-allowed" : "opacity-80 hover:opacity-100")}`}
                            >
                                {/* Node Indicator */}
                                <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors bg-black z-10
                                    ${isCompleted ? "border-primary text-primary" : (isActive ? "border-white text-white animate-pulse" : "border-[#333] text-gray-600")}
                                `}>
                                    {isCompleted ? <CheckCircle2 size={18} /> : (isLocked ? <Lock size={16} /> : <span className="font-mono text-xs">{chapter.id}</span>)}
                                </div>

                                {/* Card Content */}
                                <div className={`border p-4 transition-all duration-300
                                    ${activeChapter === chapter.id ? "bg-[#1a1a1a] border-primary/50" : "bg-[#0a0a0a] border-[#333] hover:border-gray-500"}
                                `}>
                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono mb-1">{chapter.type}</p>
                                    <h4 className={`font-heading text-lg uppercase mb-2 ${activeChapter === chapter.id ? "text-white" : "text-gray-400"}`}>
                                        {chapter.title}
                                    </h4>
                                    {isLocked && (
                                        <div className="flex items-center gap-2 text-[10px] text-red-500 font-mono uppercase tracking-widest">
                                            <Lock size={10} /> {chapter.requirement}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: Content Viewer */}
            <div className="lg:col-span-8 flex flex-col h-full">
                {activeChapter ? (
                    <div className="border border-[#333] bg-[#0a0a0a] flex-1 flex flex-col relative overflow-hidden shadow-2xl">
                        
                        {/* Visual Header */}
                        <div className={`h-64 w-full relative overflow-hidden ${story.chapters.find(c => c.id === activeChapter)?.image}`}>
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
                            
                            {/* Overlay Data */}
                            <div className="absolute bottom-6 left-6 right-6">
                                <h2 className="font-heading text-5xl text-white uppercase tracking-wide mb-2">
                                    {story.chapters.find(c => c.id === activeChapter)?.title}
                                </h2>
                                <p className="text-gray-300 font-sans max-w-xl text-lg">
                                    {story.chapters.find(c => c.id === activeChapter)?.description}
                                </p>
                            </div>
                        </div>

                        {/* Interactive Area */}
                        <div className="p-8 flex-1 flex flex-col">
                            
                            <div className="flex-1 font-mono text-gray-400 text-sm leading-relaxed space-y-4">
                                <p>
                                    <span className="text-primary mr-2">&gt;</span>
                                    {story.chapters.find(c => c.id === activeChapter)?.content}
                                </p>
                                {story.chapters.find(c => c.id === activeChapter)?.status === "completed" && (
                                    <p className="text-green-500 mt-4">
                                        <span className="mr-2">&gt;</span>
                                        Log Entry Complete. Proceed to next coordinate.
                                    </p>
                                )}
                            </div>

                            {/* Action Bar */}
                            <div className="mt-8 pt-6 border-t border-[#333] flex justify-between items-center">
                                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                                    Terminal ID: 8821-X
                                </div>
                                {story.chapters.find(c => c.id === activeChapter)?.status === "active" ? (
                                    <Button className="bg-primary text-black hover:bg-white hover:text-black font-heading uppercase tracking-widest px-8">
                                        Enter Input <Terminal size={16} className="ml-2" />
                                    </Button>
                                ) : (
                                    <Button variant="ghost" disabled className="text-gray-600 uppercase tracking-widest font-mono text-xs">
                                        Archived
                                    </Button>
                                )}
                            </div>

                        </div>

                        {/* Scanlines Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-10 pointer-events-none"></div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center border border-[#333] bg-[#0a0a0a] text-gray-600 font-mono text-xs uppercase tracking-widest">
                        Select a data node to decrypt
                    </div>
                )}
            </div>

        </div>
      </div>
    </main>
  );
}

