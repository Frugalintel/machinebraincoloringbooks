"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { RunningHead } from "@/components/home-plate";
import { StoryDisplayTitle } from "@/components/stories/story-display-title";
import { StoryMap } from "@/components/stories/story-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { logger } from "@/lib/logger";
import { supabase } from "@/lib/supabase";
import {
  choiceTaken,
  isStoryReading,
  isStoryUnlocked,
  minutesLabel,
  paragraphsOf,
  plateNumber,
  storyAction,
  storyMapMode,
  storyPointsNote,
  storyStateWord,
  titleLines,
} from "@/lib/story-catalog";
import type { StoryMapNodeInput } from "@/lib/story-map";
import { getStoryPoints, POINTS_EARN_COPY } from "@/lib/story-points";
import type { SampleStoryView } from "@/lib/story-samples";
import { storyWorld } from "@/lib/story-world";
import type { Story, StoryNode, UserStoryProgress } from "@/lib/types";
import { StoryCta, StoryPlate, storyHref } from "../story-plate";
import { useStoryCards, type StoryCard } from "../use-story-cards";

type StoryRecord = Story & {
  category?: string | null;
  cost_pts?: unknown;
  points_cost?: unknown;
  point_price?: unknown;
};

function nodeInputs(nodes: readonly StoryNode[]): StoryMapNodeInput[] {
  return nodes.map((node) => {
    const content = node.content?.trim() ?? "";
    const label =
      content && content.length <= 42 && !content.includes(".")
        ? content
        : undefined;
    return {
      id: node.id,
      label,
      choices: node.choices ?? [],
      position: node.position,
    };
  });
}

export function StoryClient({
  id,
  samples,
  preview,
  catalog,
  samplePoints,
}: {
  id: string;
  samples: boolean;
  preview: SampleStoryView | null;
  catalog: readonly SampleStoryView[];
  samplePoints?: number;
}) {
  const params = useSearchParams();
  const fixture =
    Boolean(preview) && samples && params.get("reader") === "sample";
  const { cards } = useStoryCards(samples, fixture, catalog, samplePoints);
  const others = cards.filter((card) => card.id !== id);
  const known = cards.find((card) => card.id === id);
  const plateOf = (storyId: string) => {
    const fromCards = cards.findIndex((card) => card.id === storyId);
    if (fromCards >= 0) return fromCards;
    const fromSample = catalog.findIndex((story) => story.id === storyId);
    return fromSample < 0 ? 0 : fromSample;
  };

  if (fixture && preview) {
    return (
      <SampleStory
        preview={preview}
        others={others}
        fixture
        plateOf={plateOf}
        samplePoints={samplePoints}
      />
    );
  }

  if (!fixture && preview && samples) {
    return (
      <SampleStory
        preview={preview}
        others={others}
        fixture={false}
        plateOf={plateOf}
        samplePoints={samplePoints}
      />
    );
  }

  return (
    <LiveStory
      id={id}
      others={others}
      productHref={known?.productHref}
      plateOf={plateOf}
    />
  );
}

function SampleStory({
  preview,
  others,
  fixture,
  plateOf,
  samplePoints,
}: {
  preview: SampleStoryView;
  others: StoryCard[];
  fixture: boolean;
  plateOf: (storyId: string) => number;
  samplePoints?: number;
}) {
  const story = preview;
  const { openAuthModal } = useAuth();
  const [completed, setCompleted] = useState<string[]>(
    fixture && story ? story.completedIds : [],
  );
  const [current, setCurrent] = useState<string | null>(
    fixture && story && story.state !== "locked"
      ? (story.currentId ?? story.nodes[0]?.id ?? null)
      : null,
  );

  useEffect(() => {
    if (!story) return;
    document.title = `${story.title} · Machine Brain`;
  }, [story]);

  const unlocked = fixture && story.state !== "locked";
  const reading =
    unlocked && (story.state === "reading" || completed.length > 0);
  const balance = fixture ? samplePoints : undefined;
  const card: StoryCard = {
    id: story.id,
    title: story.title,
    lines: titleLines(story.title, story.lines),
    synopsis: story.synopsis,
    minutes: story.minutes,
    world: storyWorld(story.worldName),
    nodes: story.nodes,
    cover: story.art,
    sample: true,
    cost: story.cost,
    balance,
    unlocked,
    reading,
    completedIds: fixture ? completed : [],
    currentId: fixture ? current : null,
    currentLabel: story.nodes.find((node) => node.id === current)?.label,
    hasNext:
      (story.nodes.find((node) => node.id === current)?.choices?.length ?? 0) >
      0,
    codeNeeded: !unlocked,
    signedIn: fixture,
  };

  const choose = (nodeId: string, nextNodeId: string) => {
    if (!fixture || !unlocked) return;
    setCompleted((prev) => (prev.includes(nodeId) ? prev : [...prev, nodeId]));
    setCurrent(nextNodeId);
  };

  return (
    <StoryView
      card={card}
      nodes={story.nodes}
      passages={passagesFor(
        story.nodes,
        card.completedIds,
        card.currentId,
        story,
      )}
      cover={story.art}
      index={plateOf(story.id)}
      fixture={fixture}
      onSignIn={() => openAuthModal("login")}
      onChoose={choose}
      others={others}
      plateOf={plateOf}
    />
  );
}

function passagesFor(
  nodes: readonly StoryMapNodeInput[],
  completed: readonly string[],
  current: string | null,
  story: SampleStoryView,
) {
  const ids = [...completed];
  if (current && !ids.includes(current)) ids.push(current);
  return ids
    .map((nodeId) => nodes.find((node) => node.id === nodeId))
    .filter((node): node is StoryMapNodeInput => Boolean(node))
    .map((node) => {
      const chapter = story.chapters.find((item) => item.id === node.id);
      return {
        id: node.id,
        title: chapter?.title || node.label || "Part",
        paragraphs: chapter?.paragraphs ?? [],
        choices: node.choices ?? [],
        chose: chapter?.chose,
      };
    });
}

function LiveStory({
  id,
  others,
  productHref,
  plateOf,
}: {
  id: string;
  others: StoryCard[];
  productHref?: string;
  plateOf: (storyId: string) => number;
}) {
  const { user, openAuthModal } = useAuth();
  const { success, error: toastError } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const [story, setStory] = useState<StoryRecord | null>(null);
  const [progress, setProgress] = useState<UserStoryProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [timerValue, setTimerValue] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logAnalytics = useCallback(
    async (
      eventType: string,
      nodeId?: string,
      metadata?: Record<string, unknown>,
    ) => {
      try {
        await supabase.from("story_analytics").insert({
          story_id: id,
          user_id: user?.id || null,
          event_type: eventType,
          node_id: nodeId,
          metadata,
        });
      } catch {
        // Existing analytics writes fail quietly.
      }
    },
    [id, user?.id],
  );

  const fetchStoryData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setMissing(true);
        setStory(null);
        return;
      }
      const next = data as StoryRecord;
      setStory(next);
      let row: UserStoryProgress | null = null;
      if (user) {
        const { data: prog } = await supabase
          .from("user_story_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("story_id", id)
          .single();
        row = (prog as UserStoryProgress) ?? null;
        setProgress(row);
      } else {
        setProgress(null);
        void logAnalytics("start");
      }
      const content = next.content ?? [];
      if (row?.current_node_id) setActiveId(row.current_node_id);
      else if (content[0]) setActiveId(content[0].id);
    } catch (error) {
      logger.error("Error loading story details:", error);
      setMissing(true);
    } finally {
      setLoading(false);
    }
  }, [id, logAnalytics, user]);

  useEffect(() => {
    void fetchStoryData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchStoryData]);

  useEffect(() => {
    if (story?.title) document.title = `${story.title} · Machine Brain`;
  }, [story?.title]);

  const nodes = story?.content ?? [];
  const active = nodes.find((node) => node.id === activeId) ?? nodes[0];

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    if (active?.audio_url) {
      if (audio.src !== active.audio_url) {
        audio.src = active.audio_url;
        audio.loop = true;
        if (!isMuted) {
          void audio.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [active, isMuted]);

  const handleCompleteNode = useCallback(
    async (nodeId: string, nextNodeId?: string) => {
      if (!user || !story) return;
      try {
        const newCompleted = [...(progress?.completed_nodes || []), nodeId];
        const newCurrent = nextNodeId || null;
        const isComplete = !newCurrent;
        if (progress) {
          await supabase
            .from("user_story_progress")
            .update({
              completed_nodes: newCompleted,
              current_node_id: newCurrent,
              is_completed: isComplete,
              completed_at: isComplete ? new Date().toISOString() : null,
            })
            .eq("id", progress.id);
        } else {
          await supabase.from("user_story_progress").insert({
            user_id: user.id,
            story_id: story.id,
            current_node_id: newCurrent,
            completed_nodes: [nodeId],
            started_at: new Date().toISOString(),
          });
        }
        void logAnalytics("node_complete", nodeId);
        if (isComplete) {
          void logAnalytics("complete");
          if (story.rewards?.length) setShowRewards(true);
          success("Story Completed!");
        } else {
          success("Progress Saved");
        }
        await fetchStoryData();
      } catch (error) {
        logger.error("Save error:", error);
        toastError("Failed to save progress");
      }
    },
    [fetchStoryData, logAnalytics, progress, story, success, toastError, user],
  );

  useEffect(() => {
    const scanned = params.get("scanned_code");
    if (!scanned || !active || active.challenge?.type !== "scan") return;
    if (active.challenge.config.target_code === scanned) {
      void handleCompleteNode(active.id, active.choices[0]?.nextNodeId);
    } else {
      toastError("Incorrect Code Scanned");
    }
    const next = new URLSearchParams(window.location.search);
    next.delete("scanned_code");
    const query = next.toString();
    router.replace(query ? `/stories/${id}?${query}` : `/stories/${id}`);
  }, [active, handleCompleteNode, id, params, router, toastError]);

  useEffect(() => {
    if (timerActive && timerValue !== null && timerValue > 0) {
      timerRef.current = setInterval(() => {
        setTimerValue((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
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

  useEffect(() => {
    if (active?.challenge?.type === "timer") {
      setTimerValue(active.challenge.config.duration || 60);
      setTimerActive(false);
    } else {
      setTimerValue(null);
      setTimerActive(false);
    }
    setInputValue("");
  }, [active]);

  const handleChoice = async (nextNodeId: string) => {
    if (!active) return;
    void logAnalytics("choice", active.id, { choice: nextNodeId });
    await handleCompleteNode(active.id, nextNodeId);
  };

  const submitChallenge = async () => {
    if (!active?.challenge) return;
    const { type, config } = active.challenge;
    if (type === "riddle" || type === "input") {
      if (
        inputValue.toLowerCase().trim() === config.answer?.toLowerCase().trim()
      ) {
        await handleCompleteNode(active.id, active.choices[0]?.nextNodeId);
      } else {
        toastError("Incorrect Answer");
      }
      return;
    }
    if (type === "timer") {
      if (timerValue === 0) {
        toastError("Time ran out! Try again.");
        setTimerValue(config.duration || 60);
        return;
      }
      await handleCompleteNode(active.id, active.choices[0]?.nextNodeId);
    }
  };

  if (loading) {
    return (
      <main className="hero plate" aria-busy="true">
        <p className="mono">Loading</p>
      </main>
    );
  }
  if (missing || !story) notFound();

  const hasRequirements = (story.requirements?.length ?? 0) > 0;
  const codeNeeded = Boolean(story.code_needed?.trim());
  const unlocked = isStoryUnlocked({
    hasRequirements,
    hasCodeNeeded: codeNeeded,
    hasProgress: Boolean(progress),
  });
  const reading = isStoryReading({
    unlocked,
    completed: Boolean(progress?.is_completed),
    completedCount: progress?.completed_nodes?.length ?? 0,
    currentId: progress?.current_node_id ?? null,
  });
  const inputs = nodeInputs(nodes);
  const points = getStoryPoints(story);
  const card: StoryCard = {
    id: story.id,
    title: story.title,
    lines: titleLines(story.title),
    synopsis: story.synopsis ?? "",
    minutes: story.estimated_minutes,
    world: storyWorld(story.category),
    nodes: inputs,
    cover: story.cover_url,
    sample: false,
    cost: points.cost,
    balance: points.balance,
    unlocked,
    reading,
    completedIds: progress?.completed_nodes ?? [],
    currentId: active?.id ?? null,
    currentLabel: inputs.find((node) => node.id === active?.id)?.label,
    hasNext: (active?.choices?.length ?? 0) > 0,
    productHref,
    codeNeeded,
    signedIn: Boolean(user),
  };

  const completed = progress?.completed_nodes ?? [];
  const path = completed.filter((nodeId) =>
    nodes.some((node) => node.id === nodeId),
  );
  if (active && !path.includes(active.id)) path.push(active.id);
  const shown = unlocked ? path : [];
  const passages = shown.map((nodeId) => {
    const node = nodes.find((item) => item.id === nodeId);
    return {
      id: nodeId,
      title: inputs.find((item) => item.id === nodeId)?.label || "Part",
      paragraphs: paragraphsOf(node?.content ?? ""),
      choices: node?.choices ?? [],
      chose: undefined as string | undefined,
      challenge: node?.challenge,
      imageUrl: node?.image_url,
    };
  });

  return (
    <>
      {showRewards && story.rewards?.length ? (
        <div className="plate" role="dialog" aria-label="Story complete">
          <div className="rd">
            <h2 className="h2">Story complete</h2>
            <ul>
              {story.rewards.map((reward) => (
                <li key={reward.description}>{reward.description}</li>
              ))}
            </ul>
            <button
              type="button"
              className="btn"
              onClick={() => setShowRewards(false)}
            >
              Back to the story
            </button>
          </div>
        </div>
      ) : null}
      <StoryView
        card={card}
        nodes={inputs}
        passages={passages}
        cover={story.cover_url}
        index={plateOf(id)}
        fixture={false}
        onSignIn={() => openAuthModal("login")}
        onChoose={(_nodeId, next) => {
          void handleChoice(next);
        }}
        others={others}
        plateOf={plateOf}
        audio={
          nodes.some((node) => node.audio_url)
            ? {
                muted: isMuted,
                playing: isPlaying,
                toggle: () => {
                  const audio = audioRef.current;
                  if (!audio) return;
                  audio.muted = !isMuted;
                  if (!isMuted) audio.pause();
                  else void audio.play().catch(() => {});
                  setIsMuted(!isMuted);
                  setIsPlaying(isMuted);
                },
              }
            : undefined
        }
        challenge={
          active?.challenge && active.id === passages.at(-1)?.id
            ? {
                node: active,
                inputValue,
                setInputValue,
                timerValue,
                timerActive,
                setTimerActive,
                setTimerValue,
                submit: () => {
                  void submitChallenge();
                },
                storyId: id,
              }
            : undefined
        }
      />
    </>
  );
}

type Passage = {
  id: string;
  title: string;
  paragraphs: string[];
  choices: readonly { text: string; nextNodeId: string }[];
  chose?: string;
  challenge?: StoryNode["challenge"];
  imageUrl?: string;
};

function StoryView({
  card,
  nodes,
  passages,
  cover,
  index,
  fixture,
  onSignIn,
  onChoose,
  others,
  plateOf,
  audio,
  challenge,
}: {
  card: StoryCard;
  nodes: readonly StoryMapNodeInput[];
  passages: Passage[];
  cover?: string;
  index: number;
  fixture: boolean;
  onSignIn: () => void;
  onChoose: (nodeId: string, nextNodeId: string) => void;
  others: StoryCard[];
  plateOf: (storyId: string) => number;
  audio?: { muted: boolean; playing: boolean; toggle: () => void };
  challenge?: {
    node: StoryNode;
    inputValue: string;
    setInputValue: (value: string) => void;
    timerValue: number | null;
    timerActive: boolean;
    setTimerActive: (value: boolean) => void;
    setTimerValue: (value: number) => void;
    submit: () => void;
    storyId: string;
  };
}) {
  const mode = storyMapMode({
    signedIn: card.signedIn,
    unlocked: card.unlocked,
    reading: card.reading,
  });
  const state = storyStateWord({
    signedIn: card.signedIn,
    unlocked: card.unlocked,
    reading: card.reading,
    codeNeeded: card.codeNeeded,
    cost: card.cost,
  });
  const action = storyAction({
    signedIn: card.signedIn,
    unlocked: card.unlocked,
    reading: card.reading,
    productHref: card.productHref,
    href: storyHref(card.id, fixture),
  });
  const note = storyPointsNote({
    cost: card.cost,
    balance: card.balance,
    locked: !card.unlocked,
  });
  const minutes = minutesLabel(card.minutes);
  const locked = !card.unlocked;

  return (
    <main>
      <header className="plate dh" aria-labelledby="story-title">
        {cover ? <img className="bg" src={cover} alt="" /> : null}
        <RunningHead
          items={[
            plateNumber(index),
            card.world.name,
            card.sample ? "Story · sample" : "Story",
          ]}
        />
        <p className="back mono">
          <Link href={fixture ? "/stories?reader=sample" : "/stories"}>
            <span aria-hidden="true">←</span> All stories
          </Link>
        </p>
        <StoryDisplayTitle id="story-title" lines={card.lines} />
        <p className="meta mono">
          <span>{card.world.name}</span>
          {minutes ? (
            <span>
              {minutes}
              {card.sample ? " · sample" : ""}
            </span>
          ) : null}
          <span className={card.reading ? "stt is-reading" : "stt"}>
            {state}
          </span>
          {audio ? (
            <button type="button" onClick={audio.toggle}>
              {audio.muted ? "Sound off" : "Sound on"}
            </button>
          ) : null}
        </p>
        {card.sample ? <p className="smp art-l">Story art · sample</p> : null}
      </header>

      {locked ? (
        <section className="plate lk2" aria-labelledby="locked-title">
          <div className="lg">
            <div className="tx">
              <h2 id="locked-title" className="h2">
                The paths open when you unlock it.
              </h2>
              <p className="syn">{card.synopsis}</p>
              <div className="act">
                <StoryCta action={action} onSignIn={onSignIn} />
                {note ? <p className="an">{note}</p> : null}
              </div>
              <p className="an">{POINTS_EARN_COPY}</p>
              <Link className="quiet" href="/scan?mode=code">
                Enter a page code
              </Link>
            </div>
            <div className="mp">
              <StoryMap
                title={card.title}
                nodes={nodes}
                mode="ghost"
                sample={card.sample}
              />
            </div>
          </div>
        </section>
      ) : (
        <section className="plate rd" aria-label="Reading">
          <div className="rg">
            <aside className="side" aria-label="Your path">
              <div className="sticky">
                <p className="mono">Your path</p>
                <StoryMap
                  title={card.title}
                  nodes={nodes}
                  mode={mode}
                  variant="reader"
                  sample={card.sample}
                  progress={
                    card.reading
                      ? {
                          completedIds: card.completedIds,
                          currentId: card.currentId,
                        }
                      : undefined
                  }
                />
                <p className="an">
                  The bright line is the way you came. The dotted lines are the
                  choices in front of you.
                </p>
              </div>
            </aside>
            <div className="txt">
              {passages.map((passage, index) => {
                const current = index === passages.length - 1;
                const previous = passages[index - 1]?.id;
                const chose =
                  passage.chose ?? choiceTaken(nodes, previous, passage.id);
                return (
                  <section
                    key={passage.id}
                    className={current ? "ps is-now" : "ps"}
                    aria-labelledby={`part-${passage.id}`}
                  >
                    <p className="mono pn">
                      Part {String(index + 1).padStart(2, "0")}
                      {current ? " · you are here" : ""}
                    </p>
                    <h2 id={`part-${passage.id}`} className="pt">
                      {passage.title}
                    </h2>
                    {passage.imageUrl ? (
                      <img src={passage.imageUrl} alt="" />
                    ) : null}
                    {passage.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {chose && !current ? (
                      <p className="ych mono">
                        You chose <span aria-hidden="true">→</span> {chose}
                      </p>
                    ) : null}
                    {current && passage.choices.length > 0 && !challenge ? (
                      <div
                        className="choices"
                        role="group"
                        aria-label="Choose your path"
                      >
                        {passage.choices.map((choice, choiceIndex) => (
                          <button
                            key={`${choice.nextNodeId}-${choice.text}`}
                            type="button"
                            className="ch"
                            onClick={() =>
                              onChoose(passage.id, choice.nextNodeId)
                            }
                          >
                            <span className="mono">
                              {String.fromCharCode(65 + choiceIndex)}
                            </span>
                            <span className="c">{choice.text}</span>
                            <span aria-hidden="true">→</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {current && challenge ? (
                      <ChallengeBlock challenge={challenge} />
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {others.map((other) => (
        <StoryPlate
          key={other.id}
          card={other}
          index={plateOf(other.id)}
          fixture={fixture}
          onSignIn={onSignIn}
        />
      ))}
    </main>
  );
}

function ChallengeBlock({
  challenge,
}: {
  challenge: NonNullable<Parameters<typeof StoryView>[0]["challenge"]>;
}) {
  const { node, inputValue, setInputValue, timerValue, timerActive } =
    challenge;
  const kind = node.challenge?.type;
  if (!kind) return null;
  return (
    <div className="challenge">
      <p className="mono pn">Challenge</p>
      {kind === "riddle" || kind === "input" ? (
        <div>
          <p>{node.challenge?.config.question}</p>
          <Input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Enter answer..."
            aria-label="Answer"
          />
          <button type="button" className="btn" onClick={challenge.submit}>
            Submit answer
          </button>
        </div>
      ) : null}
      {kind === "timer" ? (
        <div>
          <p className="pt">{timerValue}s</p>
          {!timerActive && timerValue !== 0 ? (
            <button
              type="button"
              className="btn"
              onClick={() => challenge.setTimerActive(true)}
            >
              Start timer
            </button>
          ) : null}
          {timerActive ? (
            <button
              type="button"
              className="btn"
              onClick={() => challenge.setTimerActive(false)}
            >
              Pause
            </button>
          ) : null}
          {timerValue === 0 ? (
            <button
              type="button"
              className="btn"
              onClick={() =>
                challenge.setTimerValue(node.challenge?.config.duration || 60)
              }
            >
              Retry
            </button>
          ) : null}
          <Button
            type="button"
            onClick={challenge.submit}
            disabled={!timerActive && timerValue !== 0}
          >
            Complete task
          </Button>
        </div>
      ) : null}
      {kind === "scan" ? (
        <div>
          <p>Scan the required code to proceed.</p>
          <Link
            className="btn"
            href={`/scan?return_to=/stories/${challenge.storyId}`}
          >
            Open scanner
          </Link>
        </div>
      ) : null}
    </div>
  );
}
