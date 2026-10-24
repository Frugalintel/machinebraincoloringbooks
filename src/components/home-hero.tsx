import { getImageProps } from "next/image";
import Link from "next/link";
import { HOME_ART, HOME_HERO_COPY } from "@/lib/home";

const MOBILE_QUERY = "(max-width: 760px)";

/** Pl. 00: O3 full bleed, art-directed for mobile, with the display-face H1. */
export function HomeHero() {
  const common = {
    alt: HOME_ART.heroAlt,
    sizes: "100vw",
    loading: "eager",
    fetchPriority: "high",
  } as const;
  const { props: desktop } = getImageProps({
    ...common,
    ...HOME_ART.heroDesktop,
  });
  const {
    props: { srcSet: mobileSrcSet },
  } = getImageProps({ ...common, ...HOME_ART.heroMobile });

  return (
    <header className="hero plate" data-testid="home-hero">
      <picture className="o3">
        <source media={MOBILE_QUERY} srcSet={mobileSrcSet} sizes="100vw" />
        <img {...desktop} alt={HOME_ART.heroAlt} />
      </picture>
      <h1 className="h1 font-display">
        {HOME_HERO_COPY.lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h1>
      <div className="hfoot">
        <p className="lede">{HOME_HERO_COPY.lede}</p>
        <div className="acts">
          <Link className="btn" href={HOME_HERO_COPY.primary.href}>
            {HOME_HERO_COPY.primary.label}{" "}
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <Link className="quiet" href={HOME_HERO_COPY.secondary.href}>
            {HOME_HERO_COPY.secondary.label}
          </Link>
        </div>
      </div>
      <p className="pno mono">
        <i className="dot" aria-hidden="true" />
        &nbsp; {HOME_HERO_COPY.plate} &nbsp;·&nbsp; {HOME_HERO_COPY.plateTitle}
      </p>
    </header>
  );
}
