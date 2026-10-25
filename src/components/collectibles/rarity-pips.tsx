import { rarityLabel, rarityPips } from "@/lib/collectibles-view";

const PIP_TOTAL = 5;

export function RarityPips({ rarity }: { rarity: string }) {
  const lit = rarityPips(rarity);
  return (
    <span className="rar">
      <span className="rw">{rarity}</span>
      <span className="pips" role="img" aria-label={rarityLabel(rarity)}>
        {Array.from({ length: PIP_TOTAL }, (_, index) => (
          <i key={index} className={index < lit ? "on" : undefined} />
        ))}
      </span>
    </span>
  );
}
