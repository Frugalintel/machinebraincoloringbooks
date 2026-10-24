"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { RunningHead } from "@/components/home-plate";
import { StoryMap } from "@/components/stories/story-map";
import { useAuth } from "@/context/auth-context";
import {
  cardTitleFit,
  plateNumber,
  storyAction,
  storyMapMode,
  storyStateWord,
  whereLine,
} from "@/lib/story-catalog";
import type { SampleStoryView } from "@/lib/story-samples";
import { storyWorlds } from "@/lib/story-world";
import { StoryAccount, StoryCta, StoryPlate, storyHref } from "./story-plate";
import { useStoryCards } from "./use-story-cards";

export function StoriesSkeleton() {
  return (
    <main className="hero plate" aria-busy="true">
      <p className="mono">Loading</p>
      <div className="skeleton-map" />
    </main>
  );
}

export function StoriesBrowser({
  samples,
  catalog,
  samplePoints,
}: {
  samples: boolean;
  catalog: readonly SampleStoryView[];
  samplePoints?: number;
}) {
  const params = useSearchParams();
  const fixture = samples && params.get("reader") === "sample";
  const { openAuthModal } = useAuth();
  const { cards, loading, signedIn, balance, sampleBalance } = useStoryCards(
    samples,
    fixture,
    catalog,
    samplePoints,
  );
  const [world, setWorld] = useState("all");
  const worlds = storyWorlds(cards);
  const lead = signedIn
    ? (cards
        .filter((card) => card.reading)
        .sort((a, b) => (a.startedAt ?? "").localeCompare(b.startedAt ?? ""))
        .at(-1) ?? null)
    : (cards[0] ?? null);
  const rest = cards.filter((card) => card.id !== lead?.id);
  const visible = rest.filter(
    (card) => world === "all" || card.world.id === world,
  );
  const fit = cardTitleFit(cards.map((card) => card.lines));
  const fitStyle = {
    "--card-em": fit.desktop,
    "--card-em-m": fit.mobile,
  } as CSSProperties;
  const showSampleNote = cards.some((card) => card.sample);

  const signIn = () => openAuthModal("login");

  const heroMode = lead
    ? storyMapMode({
        signedIn: lead.signedIn,
        unlocked: lead.unlocked,
        reading: lead.reading,
      })
    : "open";
  const heroState = lead
    ? storyStateWord({
        signedIn: lead.signedIn,
        unlocked: lead.unlocked,
        reading: lead.reading,
        codeNeeded: lead.codeNeeded,
        cost: lead.cost,
      })
    : "";
  const heroAction = lead
    ? storyAction({
        signedIn: lead.signedIn,
        unlocked: lead.unlocked,
        reading: lead.reading,
        productHref: lead.productHref,
        href: storyHref(lead.id, fixture),
      })
    : null;

  const filteredName = useMemo(
    () => worlds.find((item) => item.id === world)?.name,
    [world, worlds],
  );

  return (
    <main>
      <header className="plate hero" aria-labelledby="stories-title">
        <RunningHead
          items={[
            "Pl. 00",
            "Stories · paths",
            showSampleNote ? "Sample" : "Stories",
          ]}
        />
        {lead?.lineArt || lead?.cover ? (
          <img
            className={lead.lineArt ? "bg line" : "bg"}
            src={lead.lineArt ?? lead.cover}
            alt=""
          />
        ) : null}
        <div className="hg">
          <h1 id="stories-title" className="h1">
            Stories.
          </h1>
          <div className="side">
            <p className="dek">
              Choose-your-path stories, set in the worlds of the books. Every
              fork is yours to take.
            </p>
            <StoryAccount
              signedIn={signedIn}
              balance={balance}
              sample={sampleBalance}
              onSignIn={signIn}
              onRegister={() => openAuthModal("register")}
            />
          </div>
        </div>
        {loading ? (
          <div className="fmap">
            <div className="skeleton-map" />
          </div>
        ) : lead ? (
          <div className="fmap">
            <p className="mono fk">
              {lead.reading ? "In focus" : "Featured"} · {plateNumber(0)} ·{" "}
              {lead.world.name}
            </p>
            <StoryMap
              title={lead.title}
              nodes={lead.nodes}
              mode={heroMode}
              variant="hero"
              sample={lead.sample}
              progress={
                lead.reading
                  ? {
                      completedIds: lead.completedIds,
                      currentId: lead.currentId,
                    }
                  : undefined
              }
            />
          </div>
        ) : null}
        {lead && heroAction ? (
          <div className="band">
            <h2 className="ft2">{lead.title}</h2>
            <p className="where">
              {whereLine({
                reading: lead.reading,
                currentLabel: lead.currentLabel,
                hasNext: lead.hasNext,
                synopsis: lead.synopsis,
              })}
            </p>
            <p className={lead.reading ? "stt mono is-reading" : "stt mono"}>
              {heroState}
            </p>
            <div className="act">
              <StoryCta action={heroAction} onSignIn={signIn} />
            </div>
          </div>
        ) : null}
      </header>

      <section
        className="plate lst"
        aria-labelledby="every-story"
        style={fitStyle}
      >
        <div className="lhd">
          <h2 id="every-story" className="h2">
            Every story, by its paths
          </h2>
          {worlds.length > 0 ? (
            <div className="chips" role="group" aria-label="Filter by world">
              <button
                type="button"
                className="chip mono"
                aria-pressed={world === "all"}
                onClick={() => setWorld("all")}
              >
                All
              </button>
              {worlds.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="chip mono"
                  aria-pressed={world === item.id}
                  onClick={() => setWorld(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          ) : null}
          <p className="mono fstat" role="status">
            {filteredName ? filteredName : ""}
          </p>
        </div>
      </section>

      {!loading && cards.length === 0 ? (
        <section className="plate endn">
          <p className="syn">No stories are published yet.</p>
        </section>
      ) : null}

      {visible.map((card, index) => (
        <StoryPlate
          key={card.id}
          card={card}
          index={lead ? index + 1 : index}
          fixture={fixture}
          onSignIn={signIn}
          style={fitStyle}
        />
      ))}

      {!loading && cards.length > 0 && visible.length === 0 ? (
        <section className="plate endn">
          <p className="syn">Nothing in this world yet.</p>
        </section>
      ) : null}

      {showSampleNote ? (
        <section className="plate endn">
          <p className="smp mono">
            Titles, art, maps, reading times and points are samples. The shape
            of each map would come from the story&rsquo;s nodes.
          </p>
        </section>
      ) : null}
    </main>
  );
}
