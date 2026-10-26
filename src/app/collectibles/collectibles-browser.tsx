"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { CodeEntry } from "@/components/code-entry";
import { ObjectSlot } from "@/components/collectibles/object-slot";
import { RarityPips } from "@/components/collectibles/rarity-pips";
import { SetCase } from "@/components/collectibles/set-case";
import { SetProgressBar } from "@/components/collectibles/set-progress";
import { useAuth } from "@/context/auth-context";
import type { HeroModel } from "@/lib/collectibles-view";
import { pageH1Style } from "@/lib/h1-fit";
import { useVitrine } from "./use-collectibles-reader";

function HeroCaption({ hero }: { hero: HeroModel }) {
  switch (hero.kind) {
    case "newest":
      return (
        <>
          <p className="mono">
            <i className="dot" /> Newest
          </p>
          <p className="hn">
            <Link href={hero.href}>{hero.item.name}</Link>
          </p>
          <p className="hm">
            <RarityPips rarity={hero.rarity} />
            <span className="mono">
              {hero.ownedOn ? `Owned · ${hero.ownedOn}` : "Owned"}
            </span>
          </p>
        </>
      );
    case "locked":
      return (
        <>
          <p className="mono">Locked</p>
          <p className="hn">
            <Link href={hero.href}>{hero.item.name}</Link>
          </p>
          <p className="hm">
            <RarityPips rarity={hero.rarity} />
          </p>
          <p className="req">
            <span className="mono">Requirement</span>
            <span className="rt">{hero.requirement}</span>
          </p>
        </>
      );
    case "empty":
      return (
        <>
          <p className="mono">Nothing collected yet</p>
          <p className="hn">
            <Link href={hero.href}>{hero.item.name}</Link>
          </p>
          <p className="hm">
            <RarityPips rarity={hero.rarity} />
          </p>
          <p className="req">
            <span className="mono">Requirement</span>
            <span className="rt">{hero.requirement}</span>
          </p>
        </>
      );
    default: {
      const _exhaustive: never = hero;
      return _exhaustive;
    }
  }
}

function HeroStage({ hero }: { hero: HeroModel }) {
  const owned = hero.kind === "newest";
  return (
    <figure className={owned ? "stage" : "stage empty"}>
      <Link href={hero.href} className="stage-link" aria-label={hero.item.name}>
        <ObjectSlot
          item={hero.item}
          owned={owned}
          size="large"
          className={owned ? "canvas" : "hero-ob gh"}
          unlockedAt={hero.unlockedAt}
          lastPolishedAt={hero.lastPolishedAt}
        />
        <span className="floor" aria-hidden="true" />
      </Link>
      <figcaption>
        <HeroCaption hero={hero} />
      </figcaption>
    </figure>
  );
}

export function CollectiblesBrowser({
  allowFixture,
}: {
  allowFixture: boolean;
}) {
  const { openAuthModal, isLoading } = useAuth();
  const view = useVitrine(allowFixture);
  const authPending = isLoading;
  const titleStyle = {
    ...pageH1Style([view.title]),
    "--em": view.titleEm,
  } as CSSProperties;

  return (
    <main id="main">
      <header className="plate hero" aria-labelledby="collectibles-title">
        <span className="lamp" aria-hidden="true" />
        <div className="hl">
          <p className="mono eb">Rewards</p>
          <h1
            id="collectibles-title"
            className="h1 font-display h1-fit"
            style={titleStyle}
          >
            {view.title}
          </h1>
          <p className="dek">
            Digital rewards you can unlock by entering codes from your coloring
            books.
          </p>
          <div className="act">
            {authPending ? (
              <p className="mono" aria-busy="true">
                Loading
              </p>
            ) : view.mode === "signed-out" ? (
              <button
                type="button"
                className="btn"
                onClick={() => openAuthModal("register")}
              >
                Create account <span aria-hidden="true">→</span>
              </button>
            ) : (
              <Link className="btn" href="/trophy-room">
                Go to Trophy Room <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </div>
        {view.hero ? <HeroStage hero={view.hero} /> : null}
      </header>

      <section className="cband" aria-label="Your sets and code">
        <div className="sets">
          {view.sets.map((set) => (
            <a key={set.id} className="sp" href={`#${set.anchor}`}>
              <span className="mono">{set.indexLabel}</span>
              <span className="t">{set.title}</span>
              <SetProgressBar progress={set.progress} />
            </a>
          ))}
        </div>
        {authPending ? (
          <div className="cbox gate" aria-busy="true">
            <p className="mono">Loading</p>
          </div>
        ) : view.mode === "signed-out" ? (
          <div className="cbox gate">
            <p className="ch">Have a code?</p>
            <p className="chn">Sign in to save what it unlocks.</p>
            <div className="act">
              <button
                type="button"
                className="btn"
                onClick={() => openAuthModal("register")}
              >
                Create account <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                className="quiet"
                onClick={() => openAuthModal("login")}
              >
                Sign in
              </button>
            </div>
          </div>
        ) : (
          <CodeEntry variant="plate" id="collectibles-code" />
        )}
      </section>

      <div className="cases">
        {view.sets.map((set) => (
          <SetCase key={set.id} setCase={set} titleEm={view.setTitleEm} />
        ))}
      </div>

      {!authPending && view.mode === "signed-out" ? (
        <section className="start" aria-labelledby="start-collecting">
          <p className="mono">Start collecting</p>
          <h2 id="start-collecting" className="h2">
            Keep what you find, in one place.
          </h2>
          <button
            type="button"
            className="btn"
            onClick={() => openAuthModal("register")}
          >
            Create account <span aria-hidden="true">→</span>
          </button>
        </section>
      ) : null}
    </main>
  );
}
