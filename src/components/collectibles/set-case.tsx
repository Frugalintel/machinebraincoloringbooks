"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { SetCaseModel } from "@/lib/collectibles-view";
import { nbHyphen } from "@/lib/nb-hyphen";
import { LinePlaceholder } from "./line-placeholder";
import { LinkedLines } from "./linked-lines";
import { ObjectSlot } from "./object-slot";
import { RarityPips } from "./rarity-pips";
import { SetProgressBar } from "./set-progress";

export function SetCase({
  setCase,
  titleEm,
}: {
  setCase: SetCaseModel;
  titleEm: number;
}) {
  const style = {
    "--em": titleEm,
    "--cols": setCase.bays.length,
  } as CSSProperties;
  return (
    <section
      className="case"
      data-set={setCase.slug}
      hidden={setCase.visible ? undefined : true}
      aria-labelledby={setCase.anchor}
      style={style}
    >
      <header className="chd">
        <p className="mono">
          {setCase.indexLabel} <span className="sep">/</span> Total artifacts{" "}
          {setCase.progress.total}
        </p>
        <h2 id={setCase.anchor} className="st">
          {setCase.title}
        </h2>
        <SetProgressBar progress={setCase.progress} big />
      </header>
      <ol className="bays">
        {setCase.bays.map((bay) => (
          <li key={bay.id} className={bay.owned ? "bay own" : "bay lk"}>
            <Link
              href={bay.href}
              aria-label={`${nbHyphen(bay.name)}, ${bay.owned ? "owned" : "locked"}`}
            >
              <span className="lamp" aria-hidden="true" />
              <ObjectSlot
                item={bay.item}
                owned={bay.owned}
                size="small"
                className={bay.owned ? "canvas" : "ob gh"}
                unlockedAt={bay.unlockedAt}
                lastPolishedAt={bay.lastPolishedAt}
              />
            </Link>
            <div className="cap">
              <p className="no mono">
                No. {bay.no}
                {bay.owned ? "" : " · Locked"}
              </p>
              <h3 className="nm">{nbHyphen(bay.name)}</h3>
              <RarityPips rarity={bay.rarity} />
              {bay.owned ? (
                <p className="sl mono own">
                  {bay.ownedOn ? `Owned · ${bay.ownedOn}` : "Owned"}
                </p>
              ) : (
                <p className="req">
                  <span className="mono">Requirement</span>
                  <span className="rt">{bay.requirement}</span>
                </p>
              )}
              <LinkedLines lines={bay.lines} />
            </div>
          </li>
        ))}
      </ol>
      <div className={setCase.reward.lit ? "reward lit" : "reward"}>
        <div className="rart">
          <span className="lamp" aria-hidden="true" />
          <LinePlaceholder className={setCase.reward.lit ? "ro" : "ro gh"} />
        </div>
        <div className="rtx">
          <p className="mono">Set reward</p>
          <p className="rn">{setCase.reward.name}</p>
          <p className="rl">{setCase.reward.line}</p>
          <SetProgressBar progress={setCase.progress} />
        </div>
      </div>
    </section>
  );
}
