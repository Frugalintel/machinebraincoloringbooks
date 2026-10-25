import type { CSSProperties } from "react";
import { redactionTitleEm } from "@/lib/story-title-fit";
import "./story-display-title.css";

/** Longest Redaction line, so the H1 fills the story-page measure. */
function displayEm(lines: readonly string[]): number {
  let max = 1;
  for (const line of lines) {
    const width = redactionTitleEm(line);
    if (width > max) max = width;
  }
  return max;
}

export function StoryDisplayTitle({
  id,
  lines,
}: {
  id: string;
  lines: readonly string[];
}) {
  const style = { "--title-em": displayEm(lines) } as CSSProperties;
  return (
    <h1 id={id} className="story-display-title" style={style}>
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </h1>
  );
}
