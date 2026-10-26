import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mark } from "@/components/mark";
import { pageH1Em } from "@/lib/h1-fit";
import { homeShowsSamples } from "@/lib/home";
import {
  ABOUT_ART,
  ABOUT_BEYOND_COPY,
  ABOUT_HERO_COPY,
  ABOUT_PRINCIPLES,
  ABOUT_PRINCIPLES_COPY,
  ABOUT_REST_COPY,
  ABOUT_SAMPLE_BOOKS,
  ABOUT_STUDIO_COPY,
  ABOUT_WORLDS_COPY,
} from "@/lib/about";
import { COVER_SIZE } from "@/lib/home";

const COVER_SIZES = "(max-width: 760px) 62vw, 18vw";
const SPLIT_SIZES = "(max-width: 760px) 100vw, 50vw";

function FittedLines({
  desktop,
  mobile,
}: {
  desktop: readonly string[];
  mobile: readonly string[];
}) {
  return (
    <>
      {desktop.map((line) => (
        <span key={`d-${line}`} className="ld">
          {line}
        </span>
      ))}
      {mobile.map((line) => (
        <span key={`m-${line}`} className="lm" aria-hidden="true">
          {line}
        </span>
      ))}
    </>
  );
}

export default function AboutPage() {
  const samples = homeShowsSamples(process.env.VERCEL_ENV);
  const heroStyle = {
    "--h1-em-d": pageH1Em(ABOUT_HERO_COPY.lines),
    "--h1-em-m": pageH1Em(ABOUT_HERO_COPY.mobileLines),
  } as CSSProperties;
  return (
    <main id="main">
      <section className="spread-hero" aria-labelledby="about-h1">
        <p className="spread-eye mono">
          <span className="spread-sig">{ABOUT_HERO_COPY.plate}</span>
          {ABOUT_HERO_COPY.label}
        </p>
        <h1
          id="about-h1"
          className="spread-h1 font-display h1-fit"
          style={heroStyle}
        >
          <span className="vh">{ABOUT_HERO_COPY.lines.join(" ")}</span>
          <span aria-hidden="true">
            <FittedLines
              desktop={ABOUT_HERO_COPY.lines}
              mobile={ABOUT_HERO_COPY.mobileLines}
            />
          </span>
        </h1>
        <div className="spread-hrow">
          <p className="lede">{ABOUT_HERO_COPY.lede}</p>
          <p className="mono spread-cap">{ABOUT_HERO_COPY.cap}</p>
        </div>
      </section>

      <figure className="spread" aria-label={ABOUT_HERO_COPY.splitLabel}>
        <div className="spread-pane is-line">
          <Image {...ABOUT_ART.line} alt="" sizes={SPLIT_SIZES} priority />
        </div>
        <div className="spread-pane is-color">
          <Image {...ABOUT_ART.color} alt="" sizes={SPLIT_SIZES} priority />
        </div>
        <span className="spread-seam" aria-hidden="true" />
        <figcaption className="mono">
          {ABOUT_HERO_COPY.splitCaps.map((cap) => (
            <span key={cap}>{cap}</span>
          ))}
        </figcaption>
      </figure>

      <section className="spread-rest" aria-labelledby="about-rest-h">
        <h2 id="about-rest-h" className="spread-big">
          <span className="vh">{ABOUT_REST_COPY.line}</span>
          <span aria-hidden="true">
            <FittedLines
              desktop={[ABOUT_REST_COPY.line]}
              mobile={ABOUT_REST_COPY.lineMobile}
            />
          </span>
        </h2>
        <div className="spread-rs">
          <p className="spread-big">
            <span className="vh">{ABOUT_REST_COPY.second.join(" ")}</span>
            <span aria-hidden="true">
              <FittedLines
                desktop={ABOUT_REST_COPY.second}
                mobile={ABOUT_REST_COPY.secondMobile}
              />
            </span>
          </p>
          <p className="spread-body">{ABOUT_REST_COPY.body}</p>
        </div>
      </section>

      <section className="spread-prin" aria-labelledby="about-prin-h">
        <h2 id="about-prin-h" className="vh">
          {ABOUT_PRINCIPLES_COPY.heading}
        </h2>
        <ol>
          {ABOUT_PRINCIPLES.map((item) => (
            <li key={item.n}>
              <p className="mono spread-n">
                <span className="spread-sig">{item.n}</span>
              </p>
              <h3 className="spread-h3">{item.title}</h3>
              <p className="spread-body">{item.body}</p>
            </li>
          ))}
        </ol>
        <div className="spread-mk">
          <Mark
            size={240}
            ink="cream"
            decorative
            className="max-[760px]:hidden"
          />
          <Mark
            size={96}
            ink="cream"
            decorative
            className="min-[761px]:hidden"
          />
          <p className="mono">{ABOUT_PRINCIPLES_COPY.mark}</p>
        </div>
      </section>

      <section className="spread-worlds" aria-labelledby="about-worlds-h">
        <div className="spread-wh">
          <h2 id="about-worlds-h" className="spread-h2">
            {ABOUT_WORLDS_COPY.heading}
          </h2>
          <p className="spread-body">{ABOUT_WORLDS_COPY.lead}</p>
          {samples ? (
            <p className="spread-sample mono">{ABOUT_WORLDS_COPY.sampleNote}</p>
          ) : null}
        </div>
        <ol className="spread-covers">
          {ABOUT_SAMPLE_BOOKS.map((book) => (
            <li key={book.plate}>
              <Link href="/store">
                <Image
                  src={book.cover}
                  alt={`${book.title} cover`}
                  width={COVER_SIZE.width}
                  height={COVER_SIZE.height}
                  sizes={COVER_SIZES}
                />
                <p className="mono spread-w">{book.world}</p>
                <p className="spread-t">{book.title}</p>
                <p className="spread-d">{book.detail}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="spread-beyond" aria-labelledby="about-beyond-h">
        <div className="bimg-wrap">
          <Image
            className="bimg"
            src={ABOUT_ART.glasshouse.src}
            alt={ABOUT_BEYOND_COPY.artAlt}
            fill
            sizes="100vw"
          />
        </div>
        <div className="spread-bx">
          <h2 id="about-beyond-h" className="spread-big">
            {ABOUT_BEYOND_COPY.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className="spread-body">{ABOUT_BEYOND_COPY.body}</p>
          <p className="acts">
            <Link className="btn" href={ABOUT_BEYOND_COPY.primary.href}>
              {ABOUT_BEYOND_COPY.primary.label}{" "}
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link className="quiet" href={ABOUT_BEYOND_COPY.codes.href}>
              {ABOUT_BEYOND_COPY.codes.label}
            </Link>
          </p>
        </div>
      </section>

      <section className="spread-studio" aria-labelledby="about-studio-h">
        <h2 id="about-studio-h" className="mono spread-eye">
          {ABOUT_STUDIO_COPY.heading}
        </h2>
        <div className="spread-ph" role="note">
          <p className="mono">{ABOUT_STUDIO_COPY.label}</p>
          <p className="pt">{ABOUT_STUDIO_COPY.body}</p>
        </div>
      </section>
    </main>
  );
}
