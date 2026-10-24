import Image from "next/image";
import Link from "next/link";
import { Folio, RunningHead } from "@/components/home-plate";
import {
  HOME_ART,
  HOME_CODES_COPY,
  HOME_ENTER_COPY,
  HOME_POINTS,
  HOME_REST_COPY,
  HOME_ROUTES,
  SAMPLE_CODE_MASK,
} from "@/lib/home";

/** Pl. 02: one printed page, tipped in at reduced size on the cover stock. */
export function HomeRest() {
  return (
    <section className="plate rest" aria-label="Interlude">
      <RunningHead items={["Pl. 02", "Interlude", "Shown reduced"]} />
      <figure className="tipin">
        <Image
          {...HOME_ART.page}
          alt={HOME_REST_COPY.alt}
          sizes="(max-width: 760px) 216px, 340px"
        />
        <figcaption className="mono">{HOME_REST_COPY.caption}</figcaption>
      </figure>
      <p className="q">
        {HOME_REST_COPY.line}
        <br />
        <span>{HOME_REST_COPY.second}</span>
      </p>
      <Folio number="02" />
    </section>
  );
}

/** Pl. 03: the same page at 6×, down to the code box in its foot. */
export function HomeCodes({ samples }: { samples: boolean }) {
  return (
    <section className="plate page codes" aria-labelledby="home-codes-h">
      <RunningHead items={["Pl. 03", "Unlocks", "Detail · page foot at 6×"]} />
      <div className="crop">
        <Image
          src={HOME_ART.page.src}
          alt="Detail of a printed coloring page, in line"
          fill
          sizes="(max-width: 760px) 210vw, 170vw"
        />
      </div>
      <h2 id="home-codes-h" className="line">
        {HOME_CODES_COPY.lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h2>
      <div
        className="pfoot"
        aria-label={samples ? "Sample page foot" : "Page foot"}
      >
        <span className="mono pl">{HOME_CODES_COPY.plate}</span>
        <span className="mono k">Code</span>
        <i className="mono">{samples ? SAMPLE_CODE_MASK : null}</i>
        <span className="mono r">{HOME_CODES_COPY.book}</span>
      </div>
      <p className="note mono">{HOME_CODES_COPY.note}</p>
      <Folio number="03" />
    </section>
  );
}

/** Pl. 04: the plate in line beside the same plate colored, and the points. */
export function HomeSplit() {
  return (
    <section className="plate split" aria-labelledby="home-points-h">
      <div className="pair">
        <div className="l">
          <Image
            src={HOME_ART.lineCream.src}
            alt="A plate in line, as printed"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
        <div className="c">
          <Image
            src={HOME_ART.color.src}
            alt="The same plate, colored"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
      </div>
      <RunningHead
        items={["Pl. 04", "Line / color", "Same page, before and after"]}
      />
      <h2 id="home-points-h" className="vh">
        Points for every page
      </h2>
      {HOME_POINTS.map((point, index) => (
        <div key={point.value} className={`n n${index + 1}`}>
          <b aria-hidden="true">{point.value}</b>
          <p>
            <span className="mono">{point.label}</span>
            {point.text}
          </p>
        </div>
      ))}
    </section>
  );
}

/** Pl. 04b: GET /scan?mode=code&code=…; /scan normalizes case before lookup. */
export function HomeEnter({ samples }: { samples: boolean }) {
  const hintId = "home-code-hint";
  return (
    <section className="plate enter" aria-labelledby="home-enter-h">
      <RunningHead
        items={[
          "Pl. 04b",
          "Enter a code",
          "Points for the page you just colored",
        ]}
      />
      <h2 id="home-enter-h" className="line">
        {HOME_ENTER_COPY.heading}
      </h2>
      <div className="ein">
        <div className="eside">
          <p className="lead">{HOME_ENTER_COPY.lead}</p>
          <p className="mini mono" aria-hidden="true">
            <span>Find it here</span>
            <span className="pf">
              Plate 07 &nbsp; Code <i>{samples ? SAMPLE_CODE_MASK : null}</i>
            </span>
          </p>
        </div>
        <form className="code" action={HOME_ROUTES.scan} method="get">
          <input type="hidden" name="mode" value="code" />
          <div className="flab">
            <label className="mono" htmlFor="home-code">
              {HOME_ENTER_COPY.label}
            </label>
            <span className="mono" id={hintId}>
              {samples ? HOME_ENTER_COPY.sampleHint : HOME_ENTER_COPY.hint}
            </span>
          </div>
          <div className="frow">
            <input
              id="home-code"
              name="code"
              type="text"
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              enterKeyHint="go"
              aria-describedby={hintId}
              placeholder={samples ? HOME_ENTER_COPY.placeholder : undefined}
            />
            <button className="btn" type="submit">
              {HOME_ENTER_COPY.submit}
            </button>
          </div>
        </form>
      </div>
      <div className="regbar">
        <p className="reg">
          <span className="mono">{HOME_ENTER_COPY.registerLabel}</span>
          <span className="t">{HOME_ENTER_COPY.register}</span>
        </p>
        <Link className="quiet" href={HOME_ENTER_COPY.registerCta.href}>
          {HOME_ENTER_COPY.registerCta.label}
        </Link>
      </div>
      <Folio number="04" />
    </section>
  );
}
