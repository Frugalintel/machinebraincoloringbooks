"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  ChevronRight,
  QrCode,
  Play,
  Pause,
  RefreshCw,
  Volume2,
  VolumeX,
  Trophy,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Story, StoryNode, UserStoryProgress, StoryReward } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { logger } from "@/lib/logger";
import { getStoryTheme, ADVENTURES_COPY } from "@/lib/story-utils";

interface Chapter extends StoryNode {
  status: "locked" | "active" | "completed";
  title?: string;
  description?: string;
}

export default function StoryDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<UserStoryProgress | null>(null);

  // Audio State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Rewards State
  const [showRewards, setShowRewards] = useState(false);
  const [earnedRewards, setEarnedRewards] = useState<StoryReward[]>([]);

  // Challenge State
  const [inputValue, setInputValue] = useState("");
  const [timerValue, setTimerValue] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logAnalytics = async (
    eventType: string,
    nodeId?: string,
    metadata?: Record<string, unknown>,
  ) => {
    if (!id) return;
    try {
      await supabase.from("story_analytics").insert({
        story_id: id,
        user_id: user?.id || null,
        event_type: eventType,
        node_id: nodeId,
        metadata,
      });
    } catch {
      // fail silently
    }
  };

  const fetchStoryData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Fetch Story
      const { data: storyData, error: storyError } = await supabase
        .from("stories")
        .select("*")
        .eq("id", id)
        .single();

      if (storyError || !storyData) {
        logger.error("Story fetch error:", storyError);
        setLoading(false);
        return;
      }

      const story = storyData as Story;
      setStory(story);

      // 2. Fetch Progress (if logged in)
      let userProgress: UserStoryProgress | null = null;
      if (user) {
        const { data: progData } = await supabase
          .from("user_story_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("story_id", id)
          .single();
        userProgress = progData as UserStoryProgress;
        setProgress(userProgress);
      } else {
        // Log start for anonymous (limited tracking)
        logAnalytics("start");
      }

      // 3. Process Content into Chapters
      const content = story.content || [];

      const mappedChapters: Chapter[] = content.map((node, index) => {
        let status: "locked" | "active" | "completed" = "locked";

        if (userProgress) {
          if (userProgress.completed_nodes?.includes(node.id)) {
            status = "completed";
          } else if (userProgress.current_node_id === node.id) {
            status = "active";
          } else if (
            index === 0 &&
            !userProgress.current_node_id &&
            (!userProgress.completed_nodes ||
              userProgress.completed_nodes.length === 0)
          ) {
            status = "active";
          } else {
            status = "locked";
          }
        } else {
          if (
            index === 0 &&
            !story.code_needed &&
            (!story.requirements || story.requirements.length === 0)
          ) {
            status = "active";
          }
        }

        return {
          ...node,
          title: node.challenge
            ? `Challenge: ${node.id.slice(0, 8)}`
            : `Chapter ${index + 1}`,
          description: node.content.substring(0, 50) + "...",
          status,
        };
      });

      setChapters(mappedChapters);

      if (userProgress?.current_node_id) {
        setActiveChapterId(userProgress.current_node_id);
      } else if (mappedChapters.length > 0) {
        setActiveChapterId(mappedChapters[0].id);
      }
    } catch (error) {
      logger.error("Error loading story details:", error);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchStoryData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchStoryData]);

  // Audio Playback Effect
  useEffect(() => {
    const currentChapter = chapters.find((c) => c.id === activeChapterId);
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    if (currentChapter?.audio_url) {
      if (audioRef.current.src !== currentChapter.audio_url) {
        audioRef.current.src = currentChapter.audio_url;
        audioRef.current.loop = true;
        if (!isMuted) {
          audioRef.current.play().catch(() => {}); // catch autoplay policies
          setIsPlaying(true);
        }
      }
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [activeChapterId, chapters, isMuted]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      if (!isMuted) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
      setIsMuted(!isMuted);
      setIsPlaying(!isMuted);
    }
  };

  const handleCompleteNode = useCallback(
    async (nodeId: string, nextNodeId?: string) => {
      if (!user || !story) return;

      try {
        const currentProgress = progress;
        const newCompleted = [
          ...(currentProgress?.completed_nodes || []),
          nodeId,
        ];
        const newCurrent = nextNodeId || null;
        const isComplete = !newCurrent; // If no next node, story is complete

        if (currentProgress) {
          await supabase
            .from("user_story_progress")
            .update({
              completed_nodes: newCompleted,
              current_node_id: newCurrent,
              is_completed: isComplete,
              completed_at: isComplete ? new Date().toISOString() : null,
            })
            .eq("id", currentProgress.id);
        } else {
          await supabase.from("user_story_progress").insert({
            user_id: user.id,
            story_id: story.id,
            current_node_id: newCurrent,
            completed_nodes: [nodeId],
            started_at: new Date().toISOString(),
          });
        }

        logAnalytics("node_complete", nodeId);

        if (isComplete) {
          logAnalytics("complete");
          // Show rewards
          if (story.rewards && story.rewards.length > 0) {
            setEarnedRewards(story.rewards);
            setShowRewards(true);
          }
          success("Story Completed!");
        } else {
          success("Progress Saved");
        }

        fetchStoryData();
      } catch (err) {
        logger.error("Save error:", err);
        toastError("Failed to save progress");
      }
    },
    [user, story, progress, fetchStoryData, success, toastError, id],
  );

  // Effect for scanned code
  useEffect(() => {
    const scannedCode = searchParams.get("scanned_code");
    if (scannedCode && chapters.length > 0 && activeChapterId) {
      const currentChapter = chapters.find((c) => c.id === activeChapterId);
      if (
        currentChapter &&
        currentChapter.challenge?.type === "scan" &&
        currentChapter.status === "active"
      ) {
        if (currentChapter.challenge.config.target_code === scannedCode) {
          const nextNodeId = currentChapter.choices[0]?.nextNodeId;
          handleCompleteNode(currentChapter.id, nextNodeId);
        } else {
          toastError("Incorrect Code Scanned");
        }
        const params = new URLSearchParams(window.location.search);
        params.delete("scanned_code");
        router.replace(`/stories/${id}?${params.toString()}`);
      }
    }
  }, [searchParams, chapters, activeChapterId, handleCompleteNode, id, router]);

  // Handle Timer Logic
  useEffect(() => {
    if (timerActive && timerValue !== null && timerValue > 0) {
      timerRef.current = setInterval(() => {
        setTimerValue((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerValue === 0) {
      setTimerActive(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timerValue]);

  // Reset inputs when chapter changes
  useEffect(() => {
    const currentChapter = chapters.find((c) => c.id === activeChapterId);
    if (currentChapter?.challenge?.type === "timer") {
      setTimerValue(currentChapter.challenge.config.duration || 60);
      setTimerActive(false);
    } else {
      setTimerValue(null);
      setTimerActive(false);
    }
    setInputValue("");
  }, [activeChapterId, chapters]);

  const handleSubmitChallenge = async () => {
    const currentChapter = chapters.find((c) => c.id === activeChapterId);
    if (!currentChapter || !currentChapter.challenge) return;

    const { type, config } = currentChapter.challenge;

    if (type === "riddle" || type === "input") {
      if (
        inputValue.toLowerCase().trim() === config.answer?.toLowerCase().trim()
      ) {
        const nextNodeId = currentChapter.choices[0]?.nextNodeId;
        await handleCompleteNode(currentChapter.id, nextNodeId);
      } else {
        toastError("Incorrect Answer");
      }
    } else if (type === "timer") {
      if (timerValue === 0) {
        toastError("Time ran out! Try again.");
        setTimerValue(config.duration || 60);
        return;
      }
      const nextNodeId = currentChapter.choices[0]?.nextNodeId;
      await handleCompleteNode(currentChapter.id, nextNodeId);
    }
  };

  const handleChoice = async (nextNodeId: string) => {
    const currentChapter = chapters.find((c) => c.id === activeChapterId);
    if (!currentChapter) return;
    logAnalytics("choice", currentChapter.id, { choice: nextNodeId });
    await handleCompleteNode(currentChapter.id, nextNodeId);
  };

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
          <Link
            href="/stories"
            className="mt-8 inline-block border-b border-primary text-primary pb-1 hover:text-white transition-colors"
          >
            RETURN TO ADVENTURES
          </Link>
        </div>
      </main>
    );
  }

  const currentChapter =
    chapters.find((c) => c.id === activeChapterId) || chapters[0];
  const theme = getStoryTheme(story.title);

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-black flex flex-col">
      {/* Rewards Modal */}
      <AnimatePresence>
        {showRewards ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <div className="bg-[#111] border border-primary p-8 rounded-lg max-w-lg w-full text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none"></div>
              <Trophy size={48} className="mx-auto text-primary mb-6" />
              <h2 className="font-heading text-3xl uppercase text-white mb-2">
                Mission Complete
              </h2>
              <p className="text-gray-400 font-mono text-sm mb-8">
                You have successfully navigated the narrative.
              </p>

              <div className="space-y-4 mb-8">
                {earnedRewards.map((reward, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0a0a0a] border border-[#333] p-4 rounded flex items-center gap-4 text-left"
                  >
                    <div className="w-10 h-10 bg-[#222] rounded flex items-center justify-center text-primary">
                      <Gift size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase text-sm">
                        {reward.type} Reward
                      </h4>
                      <p className="text-xs text-gray-400">
                        {reward.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => setShowRewards(false)}
                className="w-full bg-primary text-black hover:bg-white font-heading uppercase tracking-widest"
              >
                Return to Archives
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Breadcrumb / Header */}
      <div className="border-b border-[#222] bg-[#0a0a0a] py-6 sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-widest">
            <Link
              href="/stories"
              className="hover:text-white flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={12} /> {ADVENTURES_COPY.pillarName}
            </Link>
            <ChevronRight size={10} className="text-[#333]" />
            <span
              className={`truncate max-w-[150px] md:max-w-none ${theme.textAccent}`}
            >
              {story.title}
            </span>
          </div>

          <button
            onClick={toggleMute}
            className="text-gray-500 hover:text-white transition-colors"
          >
            {isMuted ? (
              <VolumeX size={16} />
            ) : (
              <Volume2 size={16} className={isPlaying ? "text-primary" : ""} />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 h-full">
          {/* Left: Story Tree / Navigation */}
          <div className="lg:col-span-4 flex flex-col gap-8 border-r border-[#222] pr-8 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`px-2 py-0.5 rounded-sm text-[10px] font-medium uppercase tracking-wider ${theme.bgAccentLight} ${theme.textAccent}`}
                >
                  {ADVENTURES_COPY.badge}
                </div>
              </div>
              <h1 className="font-heading text-4xl text-white uppercase tracking-wide leading-tight">
                {story.title}
              </h1>
              {progress ? (
                <div className="w-full bg-[#111] h-1.5 rounded-full mt-4 overflow-hidden">
                  <div
                    className={`h-full ${theme.bgAccent}`}
                    style={{
                      width: `${Math.round((progress.completed_nodes.length / (story.content.length || 1)) * 100)}%`,
                    }}
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              {chapters.length === 0 ? (
                <div className="text-gray-500 font-mono text-xs">
                  No chapters found.
                </div>
              ) : (
                chapters.map((chapter) => {
                  const isCompleted = chapter.status === "completed";
                  const isActive = chapter.status === "active";
                  const isLocked = chapter.status === "locked";

                  return (
                    <button
                      key={chapter.id}
                      onClick={() =>
                        !isLocked && setActiveChapterId(chapter.id)
                      }
                      disabled={isLocked}
                      className={`
                                        w-full text-left p-4 rounded-lg border transition-all duration-200 group
                                        ${
                                          isActive
                                            ? `bg-[#1a1a1a] ${theme.borderAccent}`
                                            : "bg-[#0a0a0a] border-[#222] hover:border-[#444]"
                                        }
                                        ${isLocked ? "opacity-50 cursor-not-allowed" : "opacity-100"}
                                    `}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">
                            {chapter.challenge ? "Challenge" : "Chapter"}
                          </p>
                          <h4
                            className={`font-heading text-base uppercase ${isActive ? "text-white" : "text-gray-400"}`}
                          >
                            {chapter.title}
                          </h4>
                        </div>

                        <div className="mt-1">
                          {isCompleted ? (
                            <CheckCircle2
                              size={16}
                              className="text-emerald-500"
                            />
                          ) : isActive ? (
                            <div
                              className={`w-2 h-2 rounded-full ${theme.bgAccent} animate-pulse mt-1.5`}
                            />
                          ) : (
                            <Lock size={14} className="text-gray-600" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Content Viewer */}
          <div className="lg:col-span-8 flex flex-col h-full">
            {currentChapter ? (
              <motion.div
                key={currentChapter.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="border border-[#222] bg-[#0a0a0a] flex-1 flex flex-col relative overflow-hidden shadow-2xl rounded-sm min-h-[500px]"
              >
                {/* Visual Header */}
                <div
                  className={`h-64 w-full relative overflow-hidden bg-gradient-to-br from-gray-900 to-black`}
                >
                  {currentChapter.image_url ? (
                    <img
                      src={currentChapter.image_url}
                      alt="Chapter Visual"
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <h2 className="font-heading text-4xl md:text-5xl text-white uppercase tracking-wide mb-2">
                      {currentChapter.title}
                    </h2>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex-1 text-gray-300 text-lg leading-relaxed space-y-6 max-w-3xl">
                    <p>{currentChapter.content}</p>

                    {/* Challenge Interfaces */}
                    {currentChapter.status === "active" &&
                    currentChapter.challenge ? (
                      <div className="mt-8 p-6 border border-[#333] bg-[#111] rounded-lg">
                        <h3 className="font-heading text-xl text-white mb-4 uppercase">
                          Challenge Active
                        </h3>

                        {(currentChapter.challenge.type === "riddle" ||
                          currentChapter.challenge.type === "input") && (
                          <div className="space-y-4">
                            <p className="text-gray-400">
                              {currentChapter.challenge.config.question}
                            </p>
                            <Input
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              placeholder="Enter answer..."
                              className="bg-black border-[#333] text-white"
                            />
                            <Button
                              onClick={handleSubmitChallenge}
                              className={`w-full ${theme.bgAccent} text-black hover:opacity-90`}
                            >
                              Submit Answer
                            </Button>
                          </div>
                        )}

                        {currentChapter.challenge.type === "timer" && (
                          <div className="text-center space-y-6">
                            <div
                              className={`text-4xl font-mono ${theme.textAccent} animate-pulse`}
                            >
                              {timerValue}s
                            </div>
                            <div className="flex justify-center gap-4">
                              {!timerActive && timerValue !== 0 && (
                                <Button
                                  onClick={() => setTimerActive(true)}
                                  variant="outline"
                                  className={`${theme.borderAccent} ${theme.textAccent}`}
                                >
                                  <Play size={16} className="mr-2" /> Start
                                  Timer
                                </Button>
                              )}
                              {timerActive ? (
                                <Button
                                  onClick={() => setTimerActive(false)}
                                  variant="outline"
                                  className="border-yellow-500 text-yellow-500"
                                >
                                  <Pause size={16} className="mr-2" /> Pause
                                </Button>
                              ) : null}
                              {timerValue === 0 && (
                                <Button
                                  onClick={() =>
                                    setTimerValue(
                                      currentChapter.challenge!.config
                                        .duration || 60,
                                    )
                                  }
                                  variant="outline"
                                  className="border-red-500 text-red-500"
                                >
                                  <RefreshCw size={16} className="mr-2" /> Retry
                                </Button>
                              )}
                              <Button
                                onClick={handleSubmitChallenge}
                                disabled={!timerActive && timerValue !== 0}
                                className={`${theme.bgAccent} text-black hover:opacity-90`}
                              >
                                Complete Task
                              </Button>
                            </div>
                          </div>
                        )}

                        {currentChapter.challenge.type === "scan" && (
                          <div className="text-center space-y-4">
                            <QrCode
                              size={48}
                              className={`mx-auto ${theme.textAccent}`}
                            />
                            <p className="text-sm text-gray-400">
                              Scan the required code to proceed.
                            </p>
                            <Link
                              href={`/scan?return_to=/stories/${id}`}
                              className="inline-block"
                            >
                              <Button
                                className={`${theme.bgAccent} text-black hover:opacity-90`}
                              >
                                Open Scanner
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Choice Interfaces (Non-challenge) */}
                    {currentChapter.status === "active" &&
                    !currentChapter.challenge &&
                    currentChapter.choices &&
                    currentChapter.choices.length > 0 ? (
                      <div className="mt-8 space-y-3">
                        {currentChapter.choices.map((choice, idx) => (
                          <Button
                            key={idx}
                            onClick={() => handleChoice(choice.nextNodeId)}
                            className="w-full justify-start text-left h-auto py-4 border border-[#333] hover:border-white/20 hover:bg-[#161616] bg-[#111] text-white transition-all"
                          >
                            <ChevronRight
                              size={16}
                              className={`mr-2 ${theme.textAccent}`}
                            />
                            {choice.text}
                          </Button>
                        ))}
                      </div>
                    ) : null}

                    {currentChapter.status === "completed" && (
                      <p className="text-emerald-500 mt-4 flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        Chapter Complete
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center border border-[#222] bg-[#0a0a0a] text-gray-600 font-mono text-xs uppercase tracking-widest">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
