import Image from "next/image";
import Link from "next/link";
import { RunningHead } from "@/components/home-plate";
import {
  HOME_ART,
  HOME_ROUTES,
  HOME_WORLDS,
  HOME_WORLDS_COPY,
} from "@/lib/home";

/**
 * Pl. 05 and the world strip. Previews show Studio's AI sample plates;
 * production uses the real Silver Citadel colored plate and type-only tiles.
 */
export function HomeWorlds({ samples }: { samples: boolean }) {
  const bg = samples
    ? HOME_WORLDS_COPY.sampleBg
    : { src: HOME_ART.color.src, ...HOME_WORLDS_COPY.bg };

  return (
    <>
      <section
        className={samples ? "plate worlds" : "plate worlds real"}
        aria-labelledby="home-worlds-h"
      >
        <Image className="bg" src={bg.src} alt={bg.alt} fill sizes="100vw" />
        <RunningHead items={["Pl. 05", "Worlds", bg.caption]} />
        <h2 id="home-worlds-h" className="line">
          {HOME_WORLDS_COPY.heading}
        </h2>
        <div className="wfoot">
          <p className="lead">{HOME_WORLDS_COPY.lead}</p>
          <Link className="btn" href={HOME_WORLDS_COPY.cta.href}>
            {HOME_WORLDS_COPY.cta.label} <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </section>
      <ol className={samples ? "strip" : "strip type"} aria-label="Worlds">
        {HOME_WORLDS.map((world) => (
          <li key={world.name}>
            <Link href={HOME_ROUTES.world}>
              {samples ? (
                <Image
                  src={world.art}
                  alt=""
                  fill
                  sizes="(max-width: 760px) 50vw, 20vw"
                />
              ) : null}
              <span className="mono ix">{world.plate}</span>
              <span className="nm">{world.name}</span>
              <span className="dd">{world.detail}</span>
            </Link>
          </li>
        ))}
      </ol>
      {samples ? (
        <p className="smp2 mono">{HOME_WORLDS_COPY.sampleNote}</p>
      ) : null}
    </>
  );
}
