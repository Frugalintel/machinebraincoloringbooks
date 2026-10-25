import type { SetProgress } from "@/lib/collectibles-view";

export function SetProgressBar({
  progress,
  big = false,
}: {
  progress: SetProgress;
  big?: boolean;
}) {
  const className = ["prog", big ? "big" : "", progress.complete ? "done" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={className}>
      <p className="pn mono">
        <b>{progress.owned}</b>/{progress.total}
      </p>
      <span
        className="segs"
        role="img"
        aria-label={`${progress.owned} of ${progress.total} collected`}
      >
        {Array.from({ length: progress.total }, (_, index) => (
          <i
            key={index}
            className={index < progress.owned ? "on" : undefined}
          />
        ))}
      </span>
    </div>
  );
}
