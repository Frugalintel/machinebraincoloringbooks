"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HELP_CHIPS,
  HELP_FAQ,
  isHelpChipId,
  type HelpChipId,
  type HelpInline,
} from "@/lib/help";

function InlinePart({ part }: { part: HelpInline }) {
  switch (part.type) {
    case "text":
      return part.text;
    case "link":
      return <Link href={part.href}>{part.label}</Link>;
    case "placeholder":
      return <span className="help-ph-in">{part.text}</span>;
    default: {
      const _exhaustive: never = part;
      return _exhaustive;
    }
  }
}

export function HelpFaq() {
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
                  <details
                    key={item.id}
                    className="help-q"
                    id={item.id}
                    open={item.open}
                  >
                    <summary>
                      <span className="help-qt">{item.question}</span>
                      <i className="help-mark" aria-hidden="true" />
                    </summary>
                    <div className="help-a-body">
                      {item.answer.map((paragraph, index) => (
                        <p key={`${item.id}-${index}`}>
                          {paragraph.map((part, partIndex) => (
                            <InlinePart
                              key={`${item.id}-${index}-${partIndex}`}
                              part={part}
                            />
                          ))}
                        </p>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
