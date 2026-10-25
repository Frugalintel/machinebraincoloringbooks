import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HOME_CODES_COPY } from "@/lib/home";
import {
  HELP_ART,
  HELP_CONTACT_EYE,
  HELP_CONTACT_H,
  HELP_CONTACT_LEAD,
  HELP_CONTACT_PLACEHOLDER,
  HELP_CONTENTS,
  HELP_EYE,
  HELP_H1,
  HELP_HOW_EYE,
  HELP_HOW_LINES,
  HELP_LEDE,
  HELP_SAMPLE_CODE,
  HELP_SAMPLE_NOTE,
  HELP_SIGN_IN_HREF,
  HELP_STEPS,
  type HelpStep,
} from "@/lib/help";
import { HelpFaq } from "./help-faq";
import { SampleQr } from "./sample-qr";
import "./help.css";

export const metadata: Metadata = {
  title: "Help · Machine Brain",
  description: HELP_LEDE,
};

function StepArt({ step }: { step: HelpStep }) {
  switch (step.art) {
    case "qr":
      return (
        <div className="help-art help-qrbox">
          <SampleQr />
        </div>
      );
    case "code":
      return (
        <div className="help-art">
          <div className="help-foot">
            <Image
              src={HELP_ART.pageLine.src}
              alt={HELP_ART.pageLine.alt}
              width={HELP_ART.pageLine.width}
              height={HELP_ART.pageLine.height}
              sizes="(max-width: 760px) 140vw, 58vw"
            />
            <div className="help-fx mono" aria-hidden="true">
              <span>{HOME_CODES_COPY.plate}</span>
              <span className="help-cd">{HELP_SAMPLE_CODE}</span>
            </div>
          </div>
        </div>
      );
    case "photo":
      return (
        <div className="help-art">
          <Image
            src={HELP_ART.pageColor.src}
            alt={HELP_ART.pageColor.alt}
            fill
            sizes="(max-width: 760px) 100vw, 25vw"
          />
        </div>
      );
    case "trophy":
      return (
        <div className="help-art help-tro">
          <Image
            src={HELP_ART.trophy.src}
            alt={HELP_ART.trophy.alt}
            fill
            sizes="(max-width: 760px) 100vw, 25vw"
          />
        </div>
      );
    default: {
      const _exhaustive: never = step.art;
      return _exhaustive;
    }
  }
}

export default function HelpPage() {
  return (
    <div className="help-a">
      <main>
        <section className="help-hero" aria-labelledby="help-title">
          <p className="help-eye mono">
            <span className="sig">{HELP_EYE.plate}</span>
            {HELP_EYE.label}
          </p>
          <div className="help-hg">
            <h1 id="help-title" className="help-h1 font-display">
              <span>{HELP_H1}</span>
            </h1>
            <nav className="help-idx" aria-label="Help topics">
              <p className="mono">Contents</p>
              <ol>
                {HELP_CONTENTS.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`}>
                      <span className="mono">{item.n}</span>
                      <span className="t">{item.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <p className="help-lede">{HELP_LEDE}</p>
        </section>

        <section className="help-how" id="how" aria-labelledby="help-how">
          <div className="help-hh">
            <p className="help-eye mono">{HELP_HOW_EYE}</p>
            <p className="help-big" id="help-how">
              {HELP_HOW_LINES.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          </div>
          <ol className="help-steps">
            {HELP_STEPS.map((step) => (
              <li key={step.n}>
                <div className="help-stx">
                  <StepArt step={step} />
                </div>
                <p className="mono n">
                  <span className="sig">{step.n}</span>
                  {step.label}
                </p>
                <h3 className="help-h3">{step.title}</h3>
                <p className="help-body">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mono help-smpl">{HELP_SAMPLE_NOTE}</p>
        </section>

        <HelpFaq />

        <section
          className="help-contact"
          id="contact"
          aria-labelledby="help-write"
        >
          <p className="help-eye mono">
            <span className="sig">{HELP_CONTACT_EYE.n}</span>
            {HELP_CONTACT_EYE.label}
          </p>
          <p className="help-big" id="help-write">
            <span>{HELP_CONTACT_H}</span>
          </p>
          <div className="help-cg">
            <p className="help-body">{HELP_CONTACT_LEAD}</p>
            <div className="help-ph" role="note">
              <p className="mono">{HELP_CONTACT_PLACEHOLDER.label}</p>
              <p className="pt">{HELP_CONTACT_PLACEHOLDER.body}</p>
            </div>
            <p className="help-acts">
              <Link className="quiet" href="/orders/lookup">
                Order lookup
              </Link>
              <Link className="quiet" href={HELP_SIGN_IN_HREF}>
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
