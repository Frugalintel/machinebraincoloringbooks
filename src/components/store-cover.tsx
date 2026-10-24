import Image from "next/image";
import { CoverArt } from "@/components/cover-art";
import { STORE_COPY, type StoreCover } from "@/lib/store";

export type StorePlateText = {
  world: string;
  title: string;
  price: string;
};

/**
 * One 720 / 932 frame: real or SAMPLE art, else the typographic plate.
 * `decorative` drops the accessible name where a caption already names the book.
 */
export function StoreCoverView({
  cover,
  plate,
  sizes,
  priority = false,
  decorative = false,
  tone = "base",
}: {
  cover: StoreCover;
  plate: StorePlateText;
  sizes: string;
  priority?: boolean;
  decorative?: boolean;
  tone?: "base" | "paper";
}) {
  switch (cover.kind) {
    case "art": {
      const { art } = cover;
      const alt = decorative ? "" : art.alt;
      return (
        <span className="cover">
          {art.remote ? (
            <CoverArt
              src={art.src}
              alt={alt}
              sizes={sizes}
              priority={priority}
            />
          ) : (
            <Image
              src={art.src}
              alt={alt}
              fill
              sizes={sizes}
              priority={priority}
            />
          )}
          {art.sample ? (
            <span className="s-tag mono">{STORE_COPY.sampleTag}</span>
          ) : null}
        </span>
      );
    }
    case "plate":
      return (
        <span className="cover">
          <span
            className={tone === "paper" ? "s-plate paper" : "s-plate"}
            {...(decorative
              ? { "aria-hidden": true }
              : {
                  role: "img",
                  "aria-label": `${plate.title}, ${plate.world} coloring book, typographic cover`,
                })}
          >
            <span className="w">{plate.world}</span>
            <span className="t">{plate.title}</span>
            <span className="f">
              <span>Machine Brain</span>
              <span>{plate.price}</span>
            </span>
          </span>
        </span>
      );
    default: {
      const _exhaustive: never = cover;
      throw new Error(`Unhandled cover: ${String(_exhaustive)}`);
    }
  }
}
