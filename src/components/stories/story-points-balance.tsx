import "./story-points-balance.css";

/** Renders a balance only when a real points field supplied the number. */
export function StoryPointsBalance({ balance }: { balance: number }) {
  return (
    <p className="story-points-balance">
      <b>{balance}</b>
      <span>pts</span>
    </p>
  );
}
