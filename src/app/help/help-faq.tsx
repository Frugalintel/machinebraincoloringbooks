"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useOptionalAuth } from "@/context/auth-context";
import {
  HELP_CHIPS,
  HELP_FAQ,
  isHelpChipId,
  type HelpChipId,
  type HelpInline,
  type HelpQuestion,
} from "@/lib/help";

function HelpQuestionRow({
  item,
  signedIn,
}: {
  item: HelpQuestion;
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(Boolean(item.open));
  const panelId = `${item.id}-answer`;

  return (
    <div className="help-q" id={item.id} data-open={open ? "true" : "false"}>
      <button
        type="button"
        className="help-qbtn"
        id={`${item.id}-q`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="help-qt">{item.question}</span>
        <i className="help-mark" aria-hidden="true" />
      </button>
      <div
        className="help-panel"
        id={panelId}
        role="region"
        aria-labelledby={`${item.id}-q`}
      >
        <div className="help-a-body" inert={open ? undefined : true}>
          {item.answer.map((paragraph, index) => (
            <p key={`${item.id}-${index}`}>
              {paragraph.map((part, partIndex) => (
                <InlinePart
                  key={`${item.id}-${index}-${partIndex}`}
                  part={part}
                  signedIn={signedIn}
                />
              ))}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function InlinePart({
  part,
  signedIn,
}: {
  part: HelpInline;
  signedIn: boolean;
}) {
  switch (part.type) {
    case "text":
      return part.text;
    case "link":
      if (
        signedIn &&
        (part.label === "Sign in" || part.label === "Create one")
      ) {
        return (
          <Link className="hit-44" href="/profile/me">
            Profile
          </Link>
        );
      }
      return (
        <Link className="hit-44" href={part.href}>
          {part.label}
        </Link>
      );
    case "placeholder":
      return <span className="help-ph-in">{part.text}</span>;
    default: {
      const _exhaustive: never = part;
      return _exhaustive;
    }
  }
}

export function HelpFaq() {
  const { user } = useOptionalAuth();
  const signedIn = Boolean(user);
  const [filter, setFilter] = useState<HelpChipId>("all");
  const visible = useMemo(
    () => HELP_FAQ.filter((group) => filter === "all" || group.id === filter),
    [filter],
  );
  const status =
    filter === "all"
      ? "All topics"
      : (HELP_CHIPS.find((chip) => chip.id === filter)?.label ?? filter);

  return (
    <section className="help-qa" aria-labelledby="help-questions">
      <div className="help-qh">
        <h2 id="help-questions" className="help-vh">
          Questions
        </h2>
        <div
          className="help-chips"
          role="group"
          aria-label="Filter questions by topic"
        >
          {HELP_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className="help-chip"
              aria-pressed={filter === chip.id}
              onClick={() => {
                if (isHelpChipId(chip.id)) setFilter(chip.id);
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <p className="mono help-vh" role="status">
          {status}
        </p>
      </div>
      <div className="help-faq">
        {HELP_FAQ.map((group) => {
          const shown = visible.some((item) => item.id === group.id);
          return (
            <section
              key={group.id}
              className="help-grp help-topic"
              id={group.id}
              hidden={!shown}
              data-topic={group.id}
            >
              <div className="help-gh">
                <p className="mono">
                  <span className="sig">{group.n}</span>
                  {group.kicker}
                </p>
                <h2 className="help-h2">{group.heading}</h2>
              </div>
              <div className="help-qs">
                {group.questions.map((item) => (
                  <HelpQuestionRow
                    key={item.id}
                    item={item}
                    signedIn={signedIn}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
