"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { RunningHead } from "@/components/home-plate";
import { StoryMap } from "@/components/stories/story-map";
import { StoryPointsBalance } from "@/components/stories/story-points-balance";
import {
  minutesLabel,
  plateNumber,
  storyAction,
  storyMapMode,
  storyPointsNote,
  storyStateWord,
  type StoryAction,
} from "@/lib/story-catalog";
import { POINTS_EARN_COPY } from "@/lib/story-points";
import type { StoryCard } from "./use-story-cards";

export function storyHref(id: string, fixture: boolean): string {
  return fixture ? `/stories/${id}?reader=sample` : `/stories/${id}`;
}

export function StoryCta({
  action,
  onSignIn,
}: {
  action: StoryAction;
  onSignIn: () => void;
}) {
  switch (action.type) {
    case "continue":
    case "begin":
    case "book":
      return (
        <Link className="btn" href={action.href}>
          {action.label} <span aria-hidden="true">→</span>
        </Link>
      );
    case "sign-in":
      return (
        <button type="button" className="btn" onClick={onSignIn}>
          {action.label}
        </button>
      );
    case "code":
      return (
        <button type="button" className="btn" disabled>
          {action.label}
        </button>
      );
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export function StoryPlate({
  card,
  index,
  fixture,
  onSignIn,
  style,
}: {
  card: StoryCard;
  index: number;
  fixture: boolean;
  onSignIn: () => void;
  style?: CSSProperties;
}) {
  const href = storyHref(card.id, fixture);
  const action = storyAction({
    signedIn: card.signedIn,
    unlocked: card.unlocked,
    reading: card.reading,
    productHref: card.productHref,
    href,
  });
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
  const note = storyPointsNote({
    cost: card.cost,
    balance: card.balance,
    locked: !card.unlocked,
  });
  const minutes = minutesLabel(card.minutes);
  const locked = mode === "ghost";
  const short =
    action.type === "code" ||
    (note !== undefined &&
      card.balance !== undefined &&
      card.cost !== undefined &&
      card.balance < card.cost);

  return (
    <article
      className={locked ? "plate sp is-locked" : "plate sp"}
      aria-labelledby={`story-${card.id}`}
      style={style}
    >
      {card.cover ? <img className="bg" src={card.cover} alt="" /> : null}
      <RunningHead
        items={[
          plateNumber(index),
          card.world.name,
          card.sample ? "Sample" : "Paths",
        ]}
      />
      <div className="sg">
        <div className="tx">
          <h2 id={`story-${card.id}`} className="bt">
            {card.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className="syn">{card.synopsis}</p>
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
          </p>
          <div className="act">
            <StoryCta action={action} onSignIn={onSignIn} />
            {note ? <p className="an">{note}</p> : null}
            {short ? (
              <Link className="quiet" href="/scan?mode=code">
                Enter a page code
              </Link>
            ) : null}
          </div>
        </div>
        <Link
          className="mp"
          href={href}
          aria-label={`${card.title}, story page`}
        >
          <StoryMap
            title={card.title}
            nodes={card.nodes}
            mode={mode}
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
          {locked ? (
            <span className="lk mono">
              Locked · the paths open when you unlock it
            </span>
          ) : null}
        </Link>
      </div>
    </article>
  );
}

export function StoryAccount({
  signedIn,
  balance,
  sample,
  onSignIn,
  onRegister,
}: {
  signedIn: boolean;
  balance?: number;
  sample: boolean;
  onSignIn: () => void;
  onRegister: () => void;
}) {
  if (!signedIn) {
    return (
      <div className="acct">
        <p className="mono">Signed out</p>
        <p className="so">
          Sign in to see your points and open the stories you hold.
        </p>
        <div className="aa">
          <button type="button" className="btn" onClick={onSignIn}>
            Sign in <span aria-hidden="true">→</span>
          </button>
          <button type="button" className="quiet" onClick={onRegister}>
            Create an account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="acct">
      <p className="mono">
        Your points
        {sample && balance !== undefined ? <span> · sample</span> : null}
      </p>
      {balance !== undefined ? <StoryPointsBalance balance={balance} /> : null}
      <p className="earn">{POINTS_EARN_COPY}</p>
      <Link className="quiet" href="/scan?mode=code">
        Enter a page code
      </Link>
    </div>
  );
}
