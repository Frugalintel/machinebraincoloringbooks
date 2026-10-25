"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { CodeEntry } from "@/components/code-entry";
import { LinkedLines } from "@/components/collectibles/linked-lines";
import { ObjectSlot } from "@/components/collectibles/object-slot";
import { RarityPips } from "@/components/collectibles/rarity-pips";
import { SetCase } from "@/components/collectibles/set-case";
import { SetProgressBar } from "@/components/collectibles/set-progress";
import { RunningHead } from "@/components/home-plate";
import { useCollectibleDetail } from "../use-collectibles-reader";

export function CollectibleDetail({
  itemId,
  allowFixture,
}: {
  itemId: string;
  allowFixture: boolean;
}) {
  const detail = useCollectibleDetail(allowFixture, itemId);
  if (!detail) return null;

  const titleStyle = { "--em": detail.titleEm } as CSSProperties;
  const owned = detail.owned;

  return (
    <main className={owned ? "det" : "det is-locked"}>
      <header className="plate dh" aria-labelledby="collectible-title">
        <RunningHead items={detail.runningHead} />
        <p className="back mono">
          <Link href="/collectibles">
            <span aria-hidden="true">←</span> Collectibles
          </Link>
        </p>
        <div className="dstage">
          <span className="lamp" aria-hidden="true" />
          <ObjectSlot
            item={detail.item}
            owned={owned}
            size="large"
            className={owned ? "canvas" : "hero-ob gh"}
            unlockedAt={detail.unlockedAt}
            lastPolishedAt={detail.lastPolishedAt}
          />
          <span className="floor" aria-hidden="true" />
        </div>
        <h1
          id="collectible-title"
          className="h1 nm1 font-display"
          style={titleStyle}
        >
          {detail.item.name}
        </h1>
        <p className="dm">
          <RarityPips rarity={detail.rarity} />
          <span className="mono">
            {owned
              ? detail.ownedOn
                ? `Owned · ${detail.ownedOn}`
                : "Owned"
              : "Locked"}
          </span>
        </p>
      </header>

      <section className="dband" aria-label="About this collectible">
        <div className="lore">
          {owned ? (
            <>
              <p className="mono">Lore</p>
              <p className="lt">{detail.lore}</p>
            </>
          ) : (
            <>
              <p className="mono">Requirement</p>
              <p className="big-req">{detail.requirement}</p>
              <p className="lt sm">{detail.lore}</p>
            </>
          )}
          <LinkedLines lines={detail.lines} />
        </div>
        <dl className="spec">
          {detail.spec.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className="dact">
          <SetProgressBar progress={detail.setCase.progress} />
          <p className="rw2">
            <span className="mono">Set reward</span>{" "}
            {detail.setCase.reward.name}
          </p>
          {detail.action === "trophy-room" ? (
            <Link className="btn" href="/trophy-room">
              Go to Trophy Room <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <CodeEntry variant="plate" id={`code-${detail.item.id}`} />
          )}
        </div>
      </section>

      <div className="cases">
        <SetCase setCase={detail.setCase} titleEm={detail.setTitleEm} />
      </div>
    </main>
  );
}
