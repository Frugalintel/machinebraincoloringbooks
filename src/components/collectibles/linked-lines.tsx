import Link from "next/link";
import type { LinkLine } from "@/lib/collectibles-view";

function lineText(line: LinkLine): string {
  switch (line.kind) {
    case "achievement":
      return "Linked achievement: ";
    case "opens":
      return "Collecting it opens a story: ";
    case "granted":
      return "Granted by the story ";
    default: {
      const _exhaustive: never = line;
      return _exhaustive;
    }
  }
}

export function LinkedLines({ lines }: { lines: readonly LinkLine[] }) {
  if (lines.length === 0) return null;
  return (
    <>
      {lines.map((line) => (
        <p className="mis" key={`${line.kind}-${line.ref.label}`}>
          {lineText(line)}
          {line.ref.href ? (
            <Link href={line.ref.href}>{line.ref.label}</Link>
          ) : (
            line.ref.label
          )}
        </p>
      ))}
    </>
  );
}
