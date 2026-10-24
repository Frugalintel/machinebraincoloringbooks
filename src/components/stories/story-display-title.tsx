import type { CSSProperties } from "react";
import "./story-display-title.css";

function displayEm(lines: readonly string[]): number {
  let max = 1;
  for (const line of lines) {
    const count = Array.from(line).length;
    if (count > max) max = count;
  }
  return max * 0.72;
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
