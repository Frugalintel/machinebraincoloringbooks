"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logger } from "@/lib/logger";

export function CodeEntry() {
  const { user, openAuthModal } = useAuth();
  const { success } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [resultMessage, setResultMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }

    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const enteredCode = code.trim().toUpperCase();

      // 1. Find the code in book_codes table
      const { data: codeData, error: findError } = await supabase
        .from("book_codes")
        .select("*")
        .eq("code", enteredCode)
        .eq("is_active", true)
        .single();

      // 2. If not found in book_codes, check stories.code_needed
      if (findError || !codeData) {
        const { data: storyData, error: storyError } = await supabase
          .from("stories")
          .select("id, title")
          .ilike("code_needed", enteredCode)
          .single();

        if (storyError || !storyData) {
          setResult("error");
          setResultMessage("Invalid code. Try again.");
          return;
        }

        // Found a story with this code_needed - check if already unlocked
        const { data: existingProgress } = await supabase
          .from("user_story_progress")
          .select("id")
          .eq("user_id", user.id)
          .eq("story_id", storyData.id)
          .single();

        if (existingProgress) {
          setResult("error");
          setResultMessage("Story already unlocked.");
          return;
        }

        // Save story unlock to database
        const { error: insertError } = await supabase
          .from("user_story_progress")
          .insert([
            {
              user_id: user.id,
              story_id: storyData.id,
              current_node_id: "start",
            },
          ]);

        if (insertError) {
          logger.error("Error saving story progress:", insertError);
          setResult("error");
          setResultMessage("Failed to unlock story. Please try again.");
          return;
        }

        setResult("success");
        setResultMessage(`Story "${storyData.title}" Unlocked!`);
        setCode("");
        success(`Story "${storyData.title}" Unlocked!`);

        // Trigger refresh
        window.dispatchEvent(new Event("story-unlocked"));
        return;
      }

      // 3. Check if code already redeemed by this user
      const { data: existingEntry } = await supabase
        .from("user_codes")
        .select("id")
        .eq("user_id", user.id)
        .eq("code_id", codeData.id)
        .single();

      if (existingEntry) {
        setResult("error");
        setResultMessage("Code already redeemed.");
        return;
      }

      // 4. Redeem Code
      const { error: redeemError } = await supabase
        .from("user_codes")
        .insert([{ user_id: user.id, code_id: codeData.id }]);

      if (redeemError) {
        logger.error("Redeem error:", redeemError);
        setResult("error");
        setResultMessage("Failed to redeem code. Please try again.");
        return;
      }

      // 5. Handle Unlock Logic
      let unlockMsg = "Code accepted.";
      if (codeData.unlocks_type === "story") {
        // Check if user already has progress (unlocked)
        const { data: prog } = await supabase
          .from("user_story_progress")
          .select("id")
          .eq("user_id", user.id)
          .eq("story_id", codeData.unlocks_id)
          .single();

        if (!prog) {
          await supabase.from("user_story_progress").insert([
            {
              user_id: user.id,
              story_id: codeData.unlocks_id,
              current_node_id: "start",
            },
          ]);
          unlockMsg = "Story Unlocked!";
          window.dispatchEvent(new Event("story-unlocked"));
        }
      } else if (codeData.unlocks_type === "collectible") {
        await supabase.from("user_collectibles").insert([
          {
            user_id: user.id,
            collectible_id: codeData.unlocks_id,
          },
        ]);
        unlockMsg = "New Collectible Unlocked!";
      } else if (codeData.unlocks_type === "achievement") {
        await supabase.from("user_achievements").insert([
          {
            user_id: user.id,
            achievement_id: codeData.unlocks_id,
          },
        ]);
        unlockMsg = "Achievement Unlocked!";
      }

      setResult("success");
      setResultMessage(unlockMsg);
      setCode("");
      success(unlockMsg);
    } catch (err) {
      logger.error("Code entry error:", err);
      setResult("error");
      setResultMessage("System error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full opacity-20 pointer-events-none"></div>

      <form onSubmit={handleSubmit} className="relative z-10 flex gap-2">
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded blur-sm pointer-events-none"></div>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter your code"
            className="bg-[#111] border-[#333] text-white font-mono uppercase tracking-widest h-12 pl-10 focus:border-primary/50 transition-colors"
          />
          <Lock
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !code}
          className={`h-12 w-12 p-0 rounded bg-[#222] border border-[#333] hover:bg-primary hover:text-black hover:border-primary transition-all duration-300
            ${result === "success" ? "bg-green-500 text-black border-green-500" : ""}
            ${result === "error" ? "bg-red-500 text-white border-red-500" : ""}
          `}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : result === "success" ? (
            <Check size={20} />
          ) : result === "error" ? (
            <X size={20} />
          ) : (
            <Unlock size={18} />
          )}
        </Button>
      </form>

      <AnimatePresence>
        {resultMessage ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`absolute top-full left-0 right-0 mt-2 text-[10px] font-mono uppercase tracking-widest text-center
              ${result === "success" ? "text-green-500" : "text-red-500"}
            `}
          >
            {result === "error" && <span className="mr-2">⚠</span>}
            {resultMessage}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
