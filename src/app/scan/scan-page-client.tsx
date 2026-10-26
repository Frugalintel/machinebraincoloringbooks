"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { logger } from "@/lib/logger";
import { supabase } from "@/lib/supabase";
import { scanEntryFromParams, normalizeBookCode } from "@/lib/scan-params";
import {
  SAMPLE_PAGE,
  blobFromCapturedImage,
  classifyCameraError,
  createCapturedImageUrl,
  createFixtureAdapter,
  createLiveAdapter,
  fixtureSnapshot,
  requestCameraAccess,
  revokeCapturedImageUrl,
  scanPreview,
  scanPreviewCameraIssue,
  scanPreviewTrophyTier,
  signedOutCodeMessage,
  stopCameraStream,
  systemErrorMessage,
  type CameraIssue,
  type ScanLedgerSnapshot,
  type ScanViewState,
} from "@/lib/scan-ledger";
import { ScanLedgerView } from "./scan-ledger-view";

const PAGE_COLOR = "/home/plate-color.webp";

type ScannerProps = {
  onScan: (result: unknown) => void;
  onError: (error: unknown) => void;
  scanDelay?: number;
  constraints?: MediaTrackConstraints;
  styles?: { container?: object; video?: object };
  components?: object;
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return reduced;
}

function cameraMedia() {
  return navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
}

function initialState(
  preview: ScanViewState | null,
  entry: ReturnType<typeof scanEntryFromParams>,
): ScanViewState {
  if (preview) return preview;
  if (entry.mode === "code") return "code";
  return "camera-off";
}

export function ScanPageClient({ allowFixture }: { allowFixture: boolean }) {
  const params = useSearchParams();
  const previewParam = params.get("preview");
  const preview = scanPreview(allowFixture, previewParam);
  const previewTrophyTier = scanPreviewTrophyTier(allowFixture, previewParam);
  const entry = scanEntryFromParams(params);
  const { user, openAuthModal, isLoading } = useAuth();
  const { success, error: toastError } = useToast();
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const [state, setState] = useState<ScanViewState>(() =>
    initialState(preview, entry),
  );
  const [typedCode, setTypedCode] = useState(() =>
    preview === "invalid"
      ? "7KQ3"
      : entry.mode === "code"
        ? entry.code
        : preview
          ? SAMPLE_PAGE.code
          : "",
  );
  const [snapshot, setSnapshot] = useState<ScanLedgerSnapshot>(() =>
    preview
      ? fixtureSnapshot(preview, { trophyTier: previewTrophyTier ?? undefined })
      : {
          signedIn: Boolean(user),
          sample: false,
          wallet: { available: false, points: null, source: "unavailable" },
          story: null,
          books: [],
          showNextBookSlot: true,
          activePlate: null,
          unlock: null,
        },
  );
  const [capturedUrl, setCapturedUrl] = useState<string | null>(
    preview === "photo-preview" ? PAGE_COLOR : null,
  );
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [cameraOn, setCameraOn] = useState(preview === "index");
  const [cameraIssue, setCameraIssue] = useState<CameraIssue | null>(() =>
    scanPreviewCameraIssue(allowFixture, previewParam),
  );
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(
    null,
  );
  const [Scanner, setScanner] = useState<ComponentType<ScannerProps> | null>(
    null,
  );
  const [heldCode, setHeldCode] = useState(typedCode);

  const adapter = useMemo(
    () =>
      preview ? createFixtureAdapter(preview) : createLiveAdapter(supabase),
    [preview],
  );

  useEffect(() => {
    if (preview || !user) return;
    let cancelled = false;
    void adapter.getLedger(user.id).then((next) => {
      if (!cancelled) setSnapshot(next);
    });
    return () => {
      cancelled = true;
    };
  }, [adapter, preview, user]);

  useEffect(() => {
    if (preview === "signed-out-book") {
      openAuthModal("login", undefined, undefined, {
        kind: "book",
        label: "The Silver Citadel",
      });
    } else if (preview === "signed-out-code") {
      openAuthModal("login", undefined, SAMPLE_PAGE.code, {
        kind: "page-plus",
        label: SAMPLE_PAGE.code,
      });
    }
  }, [openAuthModal, preview]);

  useEffect(() => {
    return () => {
      revokeCapturedImageUrl(capturedUrl);
    };
  }, [capturedUrl]);

  useEffect(() => {
    if (!cameraOn || preview) return;
    let cancelled = false;
    void import("@yudiel/react-qr-scanner").then((mod) => {
      if (!cancelled)
        setScanner(() => mod.Scanner as ComponentType<ScannerProps>);
    });
    return () => {
      cancelled = true;
    };
  }, [cameraOn, preview]);

  const applyCodeResult = (
    result: Awaited<ReturnType<typeof adapter.submitPageCode>>,
  ) => {
    if (result.ok === false && result.kind === "signed-out") {
      openAuthModal("login", undefined, heldCode || typedCode, result.hold);
      setNotice({
        title: "Code looks valid",
        body: signedOutCodeMessage(),
      });
      setState("code");
      return;
    }
    if (result.ok === false && result.kind === "invalid") {
      setState("invalid");
      setNotice({ title: "Invalid code", body: result.message });
      return;
    }
    if (result.ok === false) {
      setState("invalid");
      setNotice({ title: "Check this", body: result.message });
      return;
    }
    setSnapshot(result.snapshot);
    setHeldCode(result.code);
    setTypedCode(result.code);
    setNotice(null);
    setState(result.kind);
    if (result.kind === "code-added") {
      success("Code accepted.");
    }
  };

  const handleScan = async (result: unknown) => {
    if (!result || state !== "index") return;
    const rawValue = Array.isArray(result)
      ? (result as { rawValue?: string }[])[0]?.rawValue
      : (result as { rawValue?: string })?.rawValue;
    if (!rawValue) return;

    const rawString = rawValue.trim();
    try {
      let storyPayload: {
        code?: string;
        framework?: string;
        stage?: unknown;
      } | null = null;
      if (rawString.startsWith("{") && rawString.endsWith("}")) {
        try {
          storyPayload = JSON.parse(rawString) as {
            code?: string;
            framework?: string;
            stage?: unknown;
          };
        } catch {
          storyPayload = null;
        }
      }

      const returnTo = params.get("return_to");
      if (returnTo) {
        const codeToReturn = storyPayload?.code || rawString;
        success("Code scanned. Returning to the story.");
        const separator = returnTo.includes("?") ? "&" : "?";
        router.push(
          `${returnTo}${separator}scanned_code=${encodeURIComponent(codeToReturn)}`,
        );
        return;
      }

      if (storyPayload && storyPayload.framework && !storyPayload.stage) {
        success(`Found story: ${storyPayload.framework}`);
        router.push(`/stories/new?framework=${storyPayload.framework}`);
        return;
      }

      const code = normalizeBookCode(rawString);
      const page = await adapter.submitPageCode({
        userId: user?.id ?? null,
        code,
      });
      if (page.ok || page.kind === "signed-out") {
        applyCodeResult(page);
        return;
      }
      if (page.kind !== "invalid") {
        applyCodeResult(page);
        return;
      }

      const registered = await adapter.registerBook({
        userId: user?.id ?? null,
        code,
      });
      if (registered.ok) {
        setSnapshot(registered.snapshot);
        setState("registered");
        return;
      }
      if (registered.kind === "signed-out") {
        openAuthModal("login", undefined, undefined, registered.hold);
        return;
      }
      toastError(registered.message);
    } catch (error) {
      logger.error("Scan error:", error);
      toastError("Something went wrong. Try again.");
    }
  };

  const onSubmitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = normalizeBookCode(typedCode);
    if (!code) return;
    const result = await adapter.submitPageCode({
      userId: user?.id ?? null,
      code,
    });
    applyCodeResult(result);
  };

  const onSendPhoto = async () => {
    if (!heldCode && !typedCode) return;
    if (preview) {
      setSending(true);
      window.setTimeout(() => {
        setSending(false);
        setState("pending");
        setSnapshot(fixtureSnapshot("pending"));
      }, 200);
      return;
    }
    if (!capturedImage && !capturedUrl) return;
    setSending(true);
    setSendError(null);
    try {
      const image = capturedImage
        ? capturedImage
        : await blobFromCapturedImage(capturedUrl as string);
      const result = await adapter.submitPagePhoto({
        userId: user?.id ?? null,
        code: heldCode || typedCode,
        image,
      });
      if (result.ok === false && result.kind === "signed-out") {
        openAuthModal("login", undefined, heldCode || typedCode, result.hold);
        setState("photo-preview");
        return;
      }
      if (result.ok === false) {
        setSendError(result.message);
        setState("photo-preview");
        return;
      }
      setSnapshot(result.snapshot);
      setState("pending");
    } catch (error) {
      logger.error("Photo send failed", error);
      setSendError(systemErrorMessage());
      setState("photo-preview");
    } finally {
      setSending(false);
    }
  };

  const readFile = (file: File) => {
    setCapturedImage(file);
    setSendError(null);
    setCapturedUrl(createCapturedImageUrl(file));
    setState("photo-preview");
  };

  const startCamera = async () => {
    const result = await requestCameraAccess({
      isSecureContext:
        typeof window === "undefined" ? true : window.isSecureContext,
      getUserMedia: cameraMedia(),
    });
    if (!result.ok) {
      setCameraIssue(result.issue);
      setCameraOn(false);
      setState("camera-off");
      return;
    }
    stopCameraStream(result.stream);
    setCameraIssue(null);
    setCameraOn(true);
    setState("index");
  };

  const cameraSlot =
    cameraOn && Scanner && !preview && state === "index" ? (
      <Scanner
        onScan={(result) => {
          void handleScan(result);
        }}
        onError={(error: unknown) => {
          logger.error("Scanner error:", error);
          setCameraIssue(classifyCameraError(error));
          setCameraOn(false);
          setState("camera-off");
        }}
        scanDelay={500}
        constraints={{
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }}
        styles={{
          container: { width: "100%", height: "100%", position: "relative" },
          video: { width: "100%", height: "100%", objectFit: "cover" },
        }}
        components={{ audio: false, torch: false }}
      />
    ) : null;

  return (
    <ScanLedgerView
      state={state}
      authPending={!preview && isLoading}
      snapshot={preview ? snapshot : { ...snapshot, signedIn: Boolean(user) }}
      typedCode={typedCode}
      capturedUrl={capturedUrl}
      cameraLive={Boolean(cameraOn && state === "index" && !preview)}
      cameraIssue={cameraIssue}
      sending={sending}
      reducedMotion={reducedMotion}
      notice={notice}
      sendError={sendError}
      cameraSlot={cameraSlot}
      handlers={{
        onEnableCamera: () => {
          void startCamera();
        },
        onMode: (mode) => {
          if (mode === "code") {
            setState("code");
            return;
          }
          void startCamera();
        },
        onCodeChange: (value) => {
          setTypedCode(value.replace(/\s+/g, "").toUpperCase());
          if (state === "invalid") {
            setState("code");
            setNotice(null);
          }
        },
        onSubmitCode,
        onAddPhoto: () => setState("photo"),
        onSkipPhoto: () => {
          setState("code");
          setTypedCode("");
          setNotice(null);
        },
        onShutter: () => {
          if (preview) {
            setCapturedUrl(PAGE_COLOR);
            setState("photo-preview");
            return;
          }
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.capture = "environment";
          input.onchange = () => {
            const file = input.files?.[0];
            if (file) readFile(file);
          };
          input.click();
        },
        onUploadFile: readFile,
        onSendPhoto: () => {
          void onSendPhoto();
        },
        onRetake: () => {
          setCapturedUrl(null);
          setCapturedImage(null);
          setSendError(null);
          setState("photo");
        },
        onAnotherCode: () => {
          setState("code");
          setTypedCode("");
          setNotice(null);
          setCapturedUrl(null);
          setCapturedImage(null);
        },
      }}
    />
  );
}
