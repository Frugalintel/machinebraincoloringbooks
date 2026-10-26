"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { resolveCollectibleUnlockFromDb } from "@/lib/collectible-unlock";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logger } from "@/lib/logger";

export function CodeEntry({
  variant = "default",
  id = "code-entry",
}: {
  variant?: "default" | "plate";
  id?: string;
} = {}) {
  const { user, openAuthModal } = useAuth();
  const { success } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [resultMessage, setResultMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (variant === "plate" && !code.trim()) {
      setResult("error");
      setResultMessage("Type the code from the back page first.");
      return;
    }
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
        setResultMessage(`"${storyData.title}" is open.`);
        setCode("");
        success(`"${storyData.title}" is open.`);

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
          unlockMsg = "Story opened.";
          window.dispatchEvent(new Event("story-unlocked"));
        }
      } else if (codeData.unlocks_type === "collectible") {
        const unlocked = await resolveCollectibleUnlockFromDb(
          supabase,
          codeData.unlocks_id,
        );
        if (unlocked) {
          await supabase.from("user_collectibles").insert([
            {
              user_id: user.id,
              collectible_id: unlocked.slug,
            },
          ]);
          unlockMsg = "Added to your collection.";
        }
      } else if (codeData.unlocks_type === "achievement") {
        await supabase.from("user_achievements").insert([
          {
            user_id: user.id,
            achievement_id: codeData.unlocks_id,
          },
        ]);
        unlockMsg = "Trophy reached.";
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

  if (variant === "plate") {
    return (
      <form className="cbox" onSubmit={handleSubmit}>
        <label htmlFor={id}>
          <span className="ch">Have a code?</span>
          <span className="chn">Find it on the back page</span>
        </label>
        <div className="frow">
          <input
            id={id}
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="Code"
            aria-describedby={resultMessage ? `${id}-status` : undefined}
          />
          <button className="btn" type="submit" disabled={loading}>
            Enter
          </button>
        </div>
        <Link className="quiet hit-44" href="/scan">
          Or scan page
        </Link>
        {resultMessage ? (
          <p id={`${id}-status`} className="status" role="status">
            {resultMessage}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto relative">
      <div className="absolute inset-0 bg-cream/5 blur-xl rounded-full opacity-20 pointer-events-none"></div>

      <form onSubmit={handleSubmit} className="relative z-10 flex gap-2">
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded blur-sm pointer-events-none"></div>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter your code"
            className="shell-focus bg-background border-line text-cream font-mono uppercase tracking-widest h-12 pl-10 focus:border-cream transition-colors"
          />
          <Lock
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !code}
          className={`h-12 w-12 p-0 rounded bg-surface-2 border border-line hover:bg-cream hover:text-ink hover:border-primary transition-all duration-300
            ${result === "success" ? "bg-success text-ink border-success" : ""}
            ${result === "error" ? "bg-danger text-cream border-danger" : ""}
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
            className={`absolute top-full left-0 right-0 mt-2 font-label uppercase tracking-widest text-center
              ${result === "success" ? "text-success" : "text-danger"}
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
