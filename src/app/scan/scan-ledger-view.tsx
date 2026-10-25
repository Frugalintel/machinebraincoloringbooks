"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { RunningHead } from "@/components/home-plate";
import {
  CAMERA_BLOCKED,
  CAMERA_INSECURE,
  SCAN_BOOK_TROPHY_LABEL,
  SCAN_OPT_LINE,
  SCAN_SAMPLE_NOTE,
  SCAN_WALLET_LABEL,
  codeInMessage,
  collectedMessage,
  folioLine,
  invalidCodeMessage,
  legendaryCaption,
  legendaryRarityNote,
  plateLabel,
  scanChrome,
  storyBarWidth,
  tierTrophyUrl,
  type BookRow,
  type PlateCell,
  type ScanLedgerSnapshot,
  type ScanViewState,
} from "@/lib/scan-ledger";
import { maxBookPoints, tiers } from "@/lib/scan-tiers";
import { ScanTrophy } from "./scan-trophy";

const PAGE_COLOR = "/home/plate-color.webp";
const PAGE_LINE = "/home/page-line.webp";
const COVER = "/home/cover-fantasy.webp";

const CELL_CLASS: Record<PlateCell, string> = {
  empty: "e",
  code: "h",
  pending: "p",
  verified: "f",
  now: "now",
  legendary: "leg",
};

const CELL_LABEL: Record<PlateCell, string> = {
  empty: "not added",
  code: "code, 1 pt",
  pending: "photo waiting for a check",
  verified: "code + verified photo, 2 pts",
  now: "adding now",
  legendary: "hidden page, 2 pts",
};

/** Fitted sizes from the locked C-ledger mockups (`--fd` / `--fm`). */
const H1_FIT: Record<ScanViewState, { fd: string; fm: string }> = {
  "signed-out-book": { fd: "9.65vw", fm: "15vw" },
  "signed-out-code": { fd: "11.05vw", fm: "15vw" },
  "camera-off": { fd: "9.93vw", fm: "15vw" },
  index: { fd: "9.65vw", fm: "15vw" },
  registered: { fd: "9.31vw", fm: "15vw" },
  code: { fd: "11.05vw", fm: "15vw" },
  "code-added": { fd: "12.59vw", fm: "15vw" },
  photo: { fd: "9.31vw", fm: "15vw" },
  "photo-preview": { fd: "13.09vw", fm: "15vw" },
  pending: { fd: "21.88vw", fm: "15vw" },
  verified: { fd: "13.60vw", fm: "15vw" },
  "tier-reached": { fd: "23.61vw", fm: "15vw" },
  "legendary-found": { fd: "10.19vw", fm: "15vw" },
  "code-only-before": { fd: "12.21vw", fm: "15vw" },
  collected: { fd: "11.80vw", fm: "15vw" },
  invalid: { fd: "10.61vw", fm: "15vw" },
};

export type ScanLedgerHandlers = {
  onEnableCamera: () => void;
  onMode: (mode: "qr" | "code") => void;
  onCodeChange: (value: string) => void;
  onSubmitCode: (event: FormEvent<HTMLFormElement>) => void;
  onAddPhoto: () => void;
  onSkipPhoto: () => void;
  onShutter: () => void;
  onUploadFile: (file: File) => void;
  onSendPhoto: () => void;
  onRetake: () => void;
  onAnotherCode: () => void;
};

export function ScanLedgerView({
  state,
  snapshot,
  typedCode,
  capturedUrl,
  cameraLive,
  cameraBlocked,
  insecure,
  sending,
  reducedMotion,
  notice,
  cameraSlot,
  handlers,
}: {
  state: ScanViewState;
  snapshot: ScanLedgerSnapshot;
  typedCode: string;
  capturedUrl: string | null;
  cameraLive: boolean;
  cameraBlocked: boolean;
  insecure: boolean;
  sending: boolean;
  reducedMotion: boolean;
  notice: { title: string; body: string } | null;
  cameraSlot?: ReactNode;
  handlers: ScanLedgerHandlers;
}) {
  const chrome = scanChrome(state);
  const plate = snapshot.activePlate;
  const folio = plate ? folioLine(plate.plate, plate.code) : "";
  const wallet = snapshot.wallet.available
    ? (snapshot.wallet.points ?? 0)
    : null;
  const story = snapshot.story;
  const balFirst =
    state === "code-added" ||
    state === "pending" ||
    state === "verified" ||
    state === "registered" ||
    state === "tier-reached" ||
    state === "legendary-found";

  return (
    <main>
      <section
        className="lg dark plate"
        data-state={state}
        data-bal-first={balFirst ? "true" : "false"}
      >
        <RunningHead
          items={["PL. 00 · Scan", chrome.running, "Example · sample book"]}
        />
        <div className="cols">
          <div className="lcol">
            <LeftPanel
              state={state}
              snapshot={snapshot}
              typedCode={typedCode}
              capturedUrl={capturedUrl}
              cameraLive={cameraLive}
              cameraBlocked={cameraBlocked}
              insecure={insecure}
              sending={sending}
              reducedMotion={reducedMotion}
              notice={notice}
              folio={folio}
              cameraSlot={cameraSlot}
              handlers={handlers}
            />
          </div>
          <div className="rcol" data-col>
            <h1
              className="h1"
              style={
                {
                  "--fd": H1_FIT[state].fd,
                  "--fm": H1_FIT[state].fm,
                } as CSSProperties
              }
            >
              {chrome.h1}
            </h1>
            <div className="bal">
              <p className="bn">
                <b>{wallet == null ? "—" : wallet}</b>
                <span className="mono">
                  pts
                  <span className="wl">{SCAN_WALLET_LABEL}</span>
                  {chrome.tag ? (
                    <span className="btag mono">{chrome.tag}</span>
                  ) : null}
                </span>
              </p>
              <div className="bnote">
                {story ? (
                  <p className="next mono">
                    <span>{story.title}</span>
                    <span className="bar">
                      <i
                        style={{
                          width: `${storyBarWidth(wallet, story.costPts)}%`,
                        }}
                      />
                    </span>
                    <span>{story.costPts} pts</span>
                  </p>
                ) : null}
                {snapshot.wallet.source === "xp" ? (
                  <p className="note-xp mono">
                    Shown from XP · wallet not on this build
                  </p>
                ) : null}
                {!snapshot.wallet.available ? (
                  <p className="note-xp mono">Wallet · not on this build</p>
                ) : null}
                {chrome.lede ? <p className="lede">{chrome.lede}</p> : null}
              </div>
            </div>
            <div className="books">
              {snapshot.books.map((book) => (
                <BookBlock key={book.id} book={book} />
              ))}
              {snapshot.showNextBookSlot ? (
                <div className="brow slot">
                  <p className="brh">
                    <b>Your next book</b>
                    <span className="mono">Scan its back cover</span>
                  </p>
                  <div className="slotl" />
                </div>
              ) : null}
            </div>
            <p className="lgd mono">
              <span>
                <i className="lc f" />2 pts · verified
              </span>
              <span>
                <i className="lc h" />1 pt · code
              </span>
              <span>
                <i className="lc p" />
                Photo pending
              </span>
              <span>
                <i className="lc e" />
                Not yet
              </span>
            </p>
            {snapshot.sample ? (
              <p className="sample smpl">{SCAN_SAMPLE_NOTE}</p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function LeftPanel({
  state,
  snapshot,
  typedCode,
  capturedUrl,
  cameraLive,
  cameraBlocked,
  insecure,
  sending,
  reducedMotion,
  notice,
  folio,
  cameraSlot,
  handlers,
}: {
  state: ScanViewState;
  snapshot: ScanLedgerSnapshot;
  typedCode: string;
  capturedUrl: string | null;
  cameraLive: boolean;
  cameraBlocked: boolean;
  insecure: boolean;
  sending: boolean;
  reducedMotion: boolean;
  notice: { title: string; body: string } | null;
  folio: string;
  cameraSlot?: ReactNode;
  handlers: ScanLedgerHandlers;
}) {
  const plate = snapshot.activePlate;
  const chrome = scanChrome(state);
  const trophyTier =
    state === "legendary-found"
      ? "Legendary"
      : state === "tier-reached"
        ? "Pro"
        : null;
  const trophyUrl = trophyTier ? tierTrophyUrl(trophyTier) : null;

  switch (state) {
    case "signed-out-book":
    case "index":
      return (
        <>
          <div className="pn">
            <div className="feed f-qr">
              {cameraLive ? (
                (cameraSlot ?? (
                  <div className="live" data-testid="live-camera" />
                ))
              ) : (
                <BackCover />
              )}
              <p className="camtag mono">
                <span className="dot" /> Camera · sample view
              </p>
            </div>
            <p className="pcap mono">{chrome.caption}</p>
          </div>
          <div className="lacts">
            <ModeChips mode="qr" onMode={handlers.onMode} />
            <button
              type="button"
              className="quiet"
              onClick={() => handlers.onMode("code")}
            >
              Type a page code
            </button>
          </div>
        </>
      );
    case "camera-off":
      return (
        <>
          <div className="pn">
            <div className="feed f-off">
              <div className="offv" aria-hidden="true" />
            </div>
            <p className="pcap mono">{chrome.caption}</p>
          </div>
          <div className="lacts">
            <button
              type="button"
              className="btn"
              onClick={handlers.onEnableCamera}
            >
              Turn on camera <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="quiet"
              onClick={() => handlers.onMode("code")}
            >
              Type a page code
            </button>
          </div>
          <div className="fb">
            <p data-active={cameraBlocked || undefined}>
              <b>Blocked</b>
              <span>{CAMERA_BLOCKED}</span>
            </p>
            <p data-active={insecure || undefined}>
              <b>Not secure</b>
              <span>{CAMERA_INSECURE}</span>
            </p>
          </div>
        </>
      );
    case "signed-out-code":
    case "code":
    case "invalid":
    case "code-only-before":
    case "collected":
      return (
        <CodeForm
          state={state}
          typedCode={typedCode}
          plate={plate}
          notice={notice}
          handlers={handlers}
        />
      );
    case "registered":
      return (
        <>
          <div className="pn art">
            <div className="artp">
              {snapshot.unlock ? (
                <Image
                  src={snapshot.unlock.image}
                  alt={`${snapshot.unlock.name}, sample collectible art`}
                  width={640}
                  height={800}
                />
              ) : null}
            </div>
            <p className="pcap mono">{chrome.caption}</p>
          </div>
          {snapshot.unlock ? (
            <div className="unl">
              <p className="un">{snapshot.unlock.name}</p>
              <p className="mono">
                {snapshot.unlock.rarity} · {snapshot.unlock.set}
              </p>
            </div>
          ) : null}
          <div className="lacts">
            <Link className="btn" href="/trophy-room">
              See it in your Trophy Room <span aria-hidden="true">→</span>
            </Link>
            <button
              type="button"
              className="quiet"
              onClick={handlers.onAnotherCode}
            >
              Add a page code
            </button>
          </div>
        </>
      );
    case "code-added":
    case "pending":
    case "verified":
      return (
        <>
          <PlatePanel
            src={state === "code-added" ? PAGE_LINE : PAGE_COLOR}
            folio={folio}
            stamp={chrome.stamp}
            caption={chrome.caption}
          />
          <div className="lacts">
            {state === "code-added" ? (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={handlers.onAddPhoto}
                >
                  Add a photo · +1 more <span aria-hidden="true">→</span>
                </button>
                <button
                  type="button"
                  className="quiet"
                  onClick={handlers.onSkipPhoto}
                >
                  Not now, next code
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={handlers.onAnotherCode}
                >
                  Enter another code <span aria-hidden="true">→</span>
                </button>
                <Link
                  className="quiet"
                  href={state === "verified" ? "/stories" : "/trophy-room"}
                >
                  {chrome.secondary}
                </Link>
              </>
            )}
          </div>
        </>
      );
    case "photo":
      return (
        <>
          <div className="pn">
            <div className="feed f-page">
              {capturedUrl ? (
                <div className="pgph">
                  {/* Captured photos are data URLs; next/image cannot optimize them. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={capturedUrl} alt="" />
                  <span className="folio-code mono">{folio}</span>
                </div>
              ) : (
                <PageInFrame folio={folio} />
              )}
              <p className="camtag mono">
                <span className="dot" /> Camera · sample view
              </p>
            </div>
            <p className="pcap mono">{chrome.caption}</p>
          </div>
          <div className="lacts">
            <button
              type="button"
              className="shut"
              aria-label="Take photo"
              onClick={handlers.onShutter}
            >
              <i />
            </button>
            <label className="quiet">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handlers.onUploadFile(file);
                }}
              />
              Upload from your photos
            </label>
            <button
              type="button"
              className="quiet"
              onClick={handlers.onSkipPhoto}
            >
              Skip
            </button>
          </div>
        </>
      );
    case "photo-preview":
      return (
        <>
          <div className="pn">
            <div className="feed f-preview">
              <div className="pvw">
                {/* Captured photos are data URLs; next/image cannot optimize them. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedUrl ?? PAGE_COLOR}
                  alt={
                    plate ? `Your photo of plate ${plate.plate}` : "Your photo"
                  }
                />
                <span className="grid9" aria-hidden="true" />
                <span className="folio-code mono">{folio}</span>
              </div>
              <p className="camtag mono">Your photo · sample</p>
            </div>
            <p className="pcap mono">{chrome.caption}</p>
          </div>
          <div className="lacts">
            <button
              type="button"
              className="btn"
              onClick={handlers.onSendPhoto}
              disabled={sending}
            >
              {sending ? "Sending…" : "Send it"}{" "}
              <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="quiet" onClick={handlers.onRetake}>
              Retake
            </button>
          </div>
        </>
      );
    case "tier-reached":
    case "legendary-found":
      return (
        <>
          {trophyUrl ? (
            <div className="pn">
              <ScanTrophy
                url={trophyUrl}
                rarity={trophyTier ?? "Rare"}
                caption={
                  state === "legendary-found"
                    ? legendaryCaption(
                        snapshot.books[0]?.legendaryFoundAt ?? 23,
                        maxBookPoints(snapshot.books[0]?.plateCount ?? 40),
                      )
                    : `${trophyTier ?? "Pro"} · example trophy`
                }
                note={
                  state === "legendary-found"
                    ? legendaryRarityNote(
                        maxBookPoints(snapshot.books[0]?.plateCount ?? 40),
                      )
                    : "Example art · placeholder"
                }
                reducedMotion={reducedMotion}
              />
              <p className="pcap mono">{chrome.caption}</p>
            </div>
          ) : (
            <PlatePanel
              src={PAGE_COLOR}
              folio={folio}
              stamp={chrome.stamp}
              caption={chrome.caption}
            />
          )}
          <div className="lacts">
            <Link className="btn" href="/trophy-room">
              See the trophy <span aria-hidden="true">→</span>
            </Link>
            <button
              type="button"
              className="quiet"
              onClick={handlers.onAnotherCode}
            >
              Enter another code
            </button>
          </div>
        </>
      );
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

function CodeForm({
  state,
  typedCode,
  plate,
  notice,
  handlers,
}: {
  state: ScanViewState;
  typedCode: string;
  plate: ScanLedgerSnapshot["activePlate"];
  notice: { title: string; body: string } | null;
  handlers: ScanLedgerHandlers;
}) {
  const bad = state === "invalid";
  const prompt =
    notice ??
    (state === "invalid"
      ? {
          title: "Invalid code",
          body: invalidCodeMessage(typedCode || "That code"),
        }
      : state === "collected"
        ? {
            title: "Collected already",
            body: collectedMessage(plate?.plate ?? "07"),
          }
        : state === "code-only-before"
          ? {
              title: "Already counted",
              body: codeInMessage(plate?.plate ?? "07"),
            }
          : null);

  return (
    <form className="cf" onSubmit={handlers.onSubmitCode}>
      <p className="mono flab">
        {plate
          ? `${plate.bookTitle} · plate ${plate.plate}`
          : "Code by the page number"}
      </p>
      <div className={`cin c ${bad ? "bad" : ""}`}>
        <label className="mono" htmlFor="pc-c">
          Code by the page number
        </label>
        <input
          id="pc-c"
          value={typedCode}
          placeholder="Code"
          maxLength={20}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={bad || undefined}
          onChange={(event) => handlers.onCodeChange(event.target.value)}
        />
      </div>
      {prompt ? (
        <p className="errl">
          <b>{prompt.title}</b>
          <span>{prompt.body}</span>
        </p>
      ) : null}
      <div className="lacts">
        {state === "collected" ? (
          <button
            type="button"
            className="btn"
            onClick={handlers.onAnotherCode}
          >
            Enter another code <span aria-hidden="true">→</span>
          </button>
        ) : state === "code-only-before" ? (
          <>
            <button type="button" className="btn" onClick={handlers.onAddPhoto}>
              Add a photo · +1 more <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="quiet"
              onClick={handlers.onAnotherCode}
            >
              Enter another code
            </button>
          </>
        ) : (
          <>
            <button type="submit" className="btn" disabled={!typedCode.trim()}>
              Add +1 <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="quiet"
              onClick={() => handlers.onMode("qr")}
            >
              Scan a back cover
            </button>
          </>
        )}
      </div>
      {state === "code" || state === "signed-out-code" ? (
        <p className="opt mono">{SCAN_OPT_LINE}</p>
      ) : null}
    </form>
  );
}

function PlatePanel({
  src,
  folio,
  stamp,
  caption,
}: {
  src: string;
  folio: string;
  stamp: string | null;
  caption: string | null;
}) {
  return (
    <div className="pn plpn">
      <div className="plp">
        <Image src={src} alt="Plate, sample" width={1391} height={1800} />
        <span className="folio-code mono">{folio}</span>
        {stamp ? <p className="stamp mono">{stamp}</p> : null}
      </div>
      {caption ? <p className="pcap mono">{caption}</p> : null}
    </div>
  );
}

function BookBlock({ book }: { book: BookRow }) {
  const max = maxBookPoints(book.plateCount);
  const ticks = tiers(book.plateCount);
  return (
    <div className="brow">
      <p className="brh">
        <b>{book.title}</b>
        {book.isNew ? <span className="tag mono">New</span> : null}
        <span className="mono" title={SCAN_BOOK_TROPHY_LABEL}>
          {book.plateCount} plates · {book.bookPoints} book pts
        </span>
        <span className="trn mono">
          <b>{book.tier}</b> · {book.next}
        </span>
      </p>
      <ol
        className="ledger"
        aria-label={`${book.title}, plates 01 to ${book.plateCount}`}
      >
        {book.plates.map((cell, index) => {
          const n = index + 1;
          const current = book.currentPlate === n;
          const hit = book.hitPlate === n;
          const cls = [
            "lc",
            CELL_CLASS[cell],
            current ? "now dot" : "",
            hit ? "hit" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <li
              key={n}
              className={cls}
              title={`Plate ${plateLabel(n)}: ${CELL_LABEL[cell]}`}
            >
              <span className="mono">{plateLabel(n)}</span>
              <span className="vh">{CELL_LABEL[cell]}</span>
            </li>
          );
        })}
      </ol>
      <div
        className="ladder rl"
        role="img"
        aria-label={`${book.bookPoints} of ${max} book points. Tiers: ${ticks
          .map((tier) => `${tier.name} ${tier.points}`)
          .join(", ")}; Legendary is a hidden page.`}
      >
        <span className="trk">
          <i
            style={{
              width: `${Math.min(100, (book.bookPoints / max) * 100)}%`,
            }}
          />
        </span>
        <ol className="mono">
          {ticks.map((tier, i) => (
            <li
              key={tier.name}
              className={`tk i${i}${book.bookPoints >= tier.points || book.legendaryFoundAt != null ? " on" : ""}`}
              style={{ left: `${(tier.points / max) * 100}%` }}
            >
              <b>{tier.name}</b>
              <span>{tier.points}</span>
            </li>
          ))}
          <li
            className={`tk lgx${book.legendaryFoundAt != null ? " on" : ""}`}
            style={{ left: "100%" }}
          >
            <b>Legendary</b>
            <span>
              {book.legendaryFoundAt != null
                ? `Found at ${book.legendaryFoundAt}`
                : "Hidden page"}
            </span>
          </li>
        </ol>
      </div>
      {book.legendaryFoundAt != null ? (
        <p className="legtag mono">
          <b>Legendary · Found at {book.legendaryFoundAt} pts</b>
          <span>Lower is rarer · 2 to {max}</span>
        </p>
      ) : null}
    </div>
  );
}

function ModeChips({
  mode,
  onMode,
}: {
  mode: "qr" | "code";
  onMode: (mode: "qr" | "code") => void;
}) {
  return (
    <div className="modes chips">
      <button
        type="button"
        className={`chip${mode === "qr" ? " on" : ""}`}
        onClick={() => onMode("qr")}
      >
        Back cover
      </button>
      <button
        type="button"
        className={`chip${mode === "code" ? " on" : ""}`}
        onClick={() => onMode("code")}
      >
        Page code
      </button>
    </div>
  );
}

function BackCover() {
  return (
    <div className="bk" aria-hidden="true">
      <div className="bkf">
        <p className="bkt mono">Sample tagline · one quiet line</p>
        <div className="bkh">
          <Image src={COVER} alt="" width={720} height={932} />
        </div>
        <p className="bkb">
          A city of glass houses and stalled machines, taken back by the garden.
        </p>
        <div className="bkq">
          <div className="qb">
            <SampleQr />
            <span className="ret trk">
              <i />
              <i />
              <i />
              <i />
              <span className="rl mono">Book code found</span>
            </span>
          </div>
          <div className="bkqr">
            <p className="mono">Scan to unlock</p>
            <div className="bkc">
              <Image
                src="/brand/mb-mark-S3-small-cream.svg"
                alt=""
                width={24}
                height={24}
              />
              <span className="mono">Machine Brain</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageInFrame({ folio }: { folio: string }) {
  return (
    <div className="pgph">
      <Image src={PAGE_COLOR} alt="" width={1391} height={1800} />
      <span className="folio-code mono">{folio}</span>
      <span className="ret pgr" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <span className="rl mono">Whole page in frame</span>
      </span>
    </div>
  );
}

function SampleQr() {
  return (
    <svg viewBox="0 0 21 21" shapeRendering="crispEdges" aria-hidden="true">
      <rect width="21" height="21" fill="#F2EAD8" />
      <path
        fill="#141414"
        d="M0 0h7v7H0zm14 0h7v7h-7zM0 14h7v7H0zM2 2h3v3H2zm14 0h3v3h-3zM2 16h3v3H2zM8 2h1v1H8zm2 0h1v2h-1zM8 5h3v1H8zm4 2h1v1h-1zM9 8h1v2H9zm2 1h2v1h-2zM8 11h1v2H8zm3 1h2v1h-2zM16 9h2v1h-2zm-1 2h1v2h-1zm3 1h2v1h-2zM9 14h1v1H9zm2 1h1v2h-1zm2 1h2v1h-2zm3 1h1v2h-1z"
      />
    </svg>
  );
}
