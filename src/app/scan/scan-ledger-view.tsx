"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useRef,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { RunningHead } from "@/components/home-plate";
import {
  PHOTO_OPTIONAL,
  SCAN_BOOK_TROPHY_LABEL,
  SCAN_OPT_LINE,
  SCAN_SIGN_IN_ACTION,
  SCAN_SIGN_IN_HREF,
  photoPreviewTag,
  signedOutScanHint,
  SCAN_WALLET_FROM_POINTS,
  SCAN_WALLET_LABEL,
  cameraIssueCopy,
  codeInMessage,
  collectedMessage,
  folioLine,
  invalidCodeMessage,
  legendaryPlateCaption,
  plateCellLabel,
  plateLabel,
  plateScanCaption,
  sampleNote,
  scanChrome,
  scanH1Fit,
  storyBarWidth,
  tierTrophyPosterUrl,
  tierTrophyUrl,
  trophyPlateCaption,
  type BookRow,
  type CameraIssue,
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

function ledgerChrome(state: ScanViewState, snapshot: ScanLedgerSnapshot) {
  return scanChrome(state, {
    trophyTier: snapshot.trophyTier,
    bookPoints: snapshot.sample ? snapshot.books[0]?.bookPoints : undefined,
  });
}

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
  cameraIssue,
  sending,
  reducedMotion,
  notice,
  sendError = null,
  cameraSlot,
  handlers,
}: {
  state: ScanViewState;
  snapshot: ScanLedgerSnapshot;
  typedCode: string;
  capturedUrl: string | null;
  cameraLive: boolean;
  cameraIssue: CameraIssue | null;
  sending: boolean;
  reducedMotion: boolean;
  notice: { title: string; body: string } | null;
  sendError?: string | null;
  cameraSlot?: ReactNode;
  handlers: ScanLedgerHandlers;
}) {
  const chrome = ledgerChrome(state, snapshot);
  const plate = snapshot.activePlate;
  const folio = plate ? folioLine(plate.plate, plate.code) : "";
  const showPhotoRun = state === "photo" || state === "photo-preview";
  const hideWallet = snapshot.signedIn && !snapshot.wallet.available;
  const wallet = !snapshot.signedIn
    ? 0
    : snapshot.wallet.available
      ? (snapshot.wallet.points ?? 0)
      : 0;
  const walletLabel =
    snapshot.wallet.source === "xp"
      ? SCAN_WALLET_FROM_POINTS
      : SCAN_WALLET_LABEL;
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
              cameraIssue={cameraIssue}
              sending={sending}
              reducedMotion={reducedMotion}
              notice={notice}
              sendError={sendError}
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
                  "--fd": scanH1Fit(state, snapshot.trophyTier).fd,
                  "--fm": scanH1Fit(state, snapshot.trophyTier).fm,
                } as CSSProperties
              }
            >
              {chrome.h1}
            </h1>
            {showPhotoRun ? (
              <>
                {plate ? (
                  <div className="run vrow">
                    <span className="vchip mono ok">
                      <b>+1 counted</b>{" "}
                      {`${plate.bookTitle} · PL. ${plate.plate}`}
                    </span>
                    <span className="mono">{PHOTO_OPTIONAL}</span>
                  </div>
                ) : null}
                {chrome.lede ? <p className="lede">{chrome.lede}</p> : null}
              </>
            ) : !snapshot.signedIn && signedOutScanHint(state) ? (
              <p className="lede">{signedOutScanHint(state)}</p>
            ) : hideWallet ? (
              chrome.lede ? (
                <p className="lede">{chrome.lede}</p>
              ) : null
            ) : (
              <div className="bal">
                <p className="bn">
                  <b>{wallet}</b>
                  <span className="mono">
                    pts
                    <span className="wl">{walletLabel}</span>
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
                  {chrome.lede ? <p className="lede">{chrome.lede}</p> : null}
                </div>
              </div>
            )}
            <div className="books">
              {snapshot.books.map((book) => (
                <BookBlock key={book.id} book={book} state={state} />
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
              <p className="sample smpl">{sampleNote(state)}</p>
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
  cameraIssue,
  sending,
  reducedMotion,
  notice,
  sendError,
  folio,
  cameraSlot,
  handlers,
}: {
  state: ScanViewState;
  snapshot: ScanLedgerSnapshot;
  typedCode: string;
  capturedUrl: string | null;
  cameraLive: boolean;
  cameraIssue: CameraIssue | null;
  sending: boolean;
  reducedMotion: boolean;
  notice: { title: string; body: string } | null;
  sendError: string | null;
  folio: string;
  cameraSlot?: ReactNode;
  handlers: ScanLedgerHandlers;
}) {
  const plate = snapshot.activePlate;
  const chrome = ledgerChrome(state, snapshot);
  const caption =
    state === "photo-preview"
      ? photoPreviewTag(snapshot.sample)
      : plateScanCaption(state, plate?.plate);
  const cameraCopy = cameraIssue
    ? cameraIssueCopy(
        cameraIssue,
        typeof navigator === "undefined" ? "" : navigator.userAgent,
      )
    : null;
  const trophyTier =
    snapshot.trophyTier ??
    (state === "legendary-found"
      ? "Legendary"
      : state === "tier-reached"
        ? "Pro"
        : null);
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
            <p className="pcap mono">{caption}</p>
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
            <p className="pcap mono">{caption}</p>
          </div>
          <div className="lacts">
            {cameraIssue?.kind === "insecure" ? null : (
              <button
                type="button"
                className="btn"
                onClick={handlers.onEnableCamera}
              >
                Turn on camera <span aria-hidden="true">→</span>
              </button>
            )}
            <button
              type="button"
              className="quiet"
              onClick={() => handlers.onMode("code")}
            >
              Type a page code
            </button>
          </div>
          {cameraCopy ? (
            <div className="fb">
              <p data-active="">
                <b>{cameraCopy.title}</b>
                <span>{cameraCopy.body}</span>
              </p>
            </div>
          ) : null}
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
          signedIn={snapshot.signedIn}
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
            <p className="pcap mono">{caption}</p>
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
            caption={caption}
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
              <span className="page-tag mono">Whole page in frame</span>
              <p className="camtag mono">
                <span className="dot" /> Camera · sample view
              </p>
            </div>
            <p className="pcap mono">{caption}</p>
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
                {capturedUrl ? (
                  // Object URLs and static preview srcs cannot go through next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={capturedUrl}
                    alt={
                      plate
                        ? `Your photo of plate ${plate.plate}`
                        : "Your photo"
                    }
                  />
                ) : null}
                <span className="grid9" aria-hidden="true" />
                <span className="folio-code mono">{folio}</span>
              </div>
              <p className="camtag mono">{photoPreviewTag(snapshot.sample)}</p>
            </div>
            <p className="pcap mono">{caption}</p>
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
            {sendError ? (
              <p className="errl" role="alert">
                <b>Couldn’t send</b>
                <span>{sendError}</span>
              </p>
            ) : null}
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
                posterUrl={tierTrophyPosterUrl(trophyTier ?? "Pro")}
                rarity={trophyTier ?? "Rare"}
                stamp={
                  state === "tier-reached" && trophyTier
                    ? `Verified · ${trophyTier} unlocked`
                    : chrome.stamp
                }
                caption={
                  state === "legendary-found" && plate
                    ? legendaryPlateCaption(plate.plate)
                    : plate
                      ? trophyPlateCaption(plate.plate, plate.code)
                      : (chrome.caption ?? "")
                }
                reducedMotion={reducedMotion}
              />
              <p className="pcap mono">
                {state === "legendary-found" && plate
                  ? legendaryPlateCaption(plate.plate)
                  : plate
                    ? trophyPlateCaption(plate.plate, plate.code)
                    : chrome.caption}
              </p>
            </div>
          ) : (
            <PlatePanel
              src={PAGE_COLOR}
              folio={folio}
              stamp={chrome.stamp}
              caption={caption}
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
  signedIn,
  notice,
  handlers,
}: {
  state: ScanViewState;
  typedCode: string;
  plate: ScanLedgerSnapshot["activePlate"];
  signedIn: boolean;
  notice: { title: string; body: string } | null;
  handlers: ScanLedgerHandlers;
}) {
  const bad = state === "invalid";
  const inputRef = useRef<HTMLInputElement>(null);
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
      {plate ? (
        <p className="mono flab">
          {`${plate.bookTitle} · plate ${plate.plate}`}
        </p>
      ) : null}
      <div
        className={`cin c ${bad ? "bad" : ""}`}
        style={{ "--len": Math.max(typedCode.length, 1) } as CSSProperties}
      >
        <label className="mono" htmlFor="pc-c">
          Code by the page number
        </label>
        <input
          ref={inputRef}
          id="pc-c"
          value={typedCode}
          placeholder="Code"
          maxLength={20}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={bad || undefined}
          onChange={(event) => handlers.onCodeChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const form = event.currentTarget.form;
            if (!form) return;
            if (typeof form.requestSubmit === "function") {
              form.requestSubmit();
              return;
            }
            form.dispatchEvent(
              new Event("submit", { bubbles: true, cancelable: true }),
            );
          }}
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
        ) : state === "invalid" ? (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => {
                handlers.onCodeChange("");
                inputRef.current?.focus();
              }}
            >
              Try again <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="quiet"
              onClick={() => handlers.onMode("qr")}
            >
              Scan a back cover
            </button>
          </>
        ) : !signedIn ? (
          <>
            <Link className="btn" href={SCAN_SIGN_IN_HREF}>
              {SCAN_SIGN_IN_ACTION} <span aria-hidden="true">→</span>
            </Link>
            <button
              type="button"
              className="quiet"
              onClick={() => handlers.onMode("qr")}
            >
              Scan a back cover
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
      {signedIn && (state === "code" || state === "signed-out-code") ? (
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

function BookBlock({ book, state }: { book: BookRow; state: ScanViewState }) {
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
          const label = plateCellLabel(cell, {
            state,
            highlight: current || hit,
          });
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
              title={`Plate ${plateLabel(n)}: ${label}`}
            >
              <span className="mono">{plateLabel(n)}</span>
              <span className="vh">{label}</span>
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
