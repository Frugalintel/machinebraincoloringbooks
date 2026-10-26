"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { RunningHead } from "@/components/home-plate";
import { StoryMap } from "@/components/stories/story-map";
import { StoryPointsBalance } from "@/components/stories/story-points-balance";
import {
  cardTitleFit,
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

function UnlockButton({
  action,
}: {
  action: Extract<StoryAction, { type: "unlock" }>;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4200);
    return () => window.clearTimeout(timer);
  }, [message]);

  return (
    <>
      <button
        type="button"
        className="btn"
        onClick={() => {
          if (!action.sample) return;
          setMessage(
            `Prototype: the live page spends ${action.cost} pts and opens ${action.title}.`,
          );
        }}
      >
        {action.label}
      </button>
      {message ? (
        <p className="story-status" role="status">
          {message}
        </p>
      ) : null}
    </>
  );
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
    case "unlock":
      return <UnlockButton action={action} />;
    case "none":
      return null;
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
    codeNeeded: card.codeNeeded,
    cost: card.cost,
    balance: card.balance,
    title: card.title,
    sample: card.sample,
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
  const titleFit = cardTitleFit([card.lines]);
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
      style={
        {
          ...style,
          "--card-em": titleFit.desktop,
          "--card-em-m": titleFit.mobile,
        } as CSSProperties
      }
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
  pending = false,
  balance,
  sample,
  onSignIn,
  onRegister,
}: {
  signedIn: boolean;
  pending?: boolean;
  balance?: number;
  sample: boolean;
  onSignIn: () => void;
  onRegister: () => void;
}) {
  if (pending) {
    return (
      <div className="acct" aria-busy="true">
        <p className="mono">Loading</p>
      </div>
    );
  }

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
            Create account
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
