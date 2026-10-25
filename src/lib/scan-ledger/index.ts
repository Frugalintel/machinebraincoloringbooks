export type {
  ActivePlate,
  AuthHold,
  AuthHoldKind,
  BookRow,
  PlateCell,
  RegisterBookResult,
  ScanLedgerAdapter,
  ScanLedgerSnapshot,
  ScanViewState,
  SubmitCodeResult,
  SubmitPhotoResult,
  WalletSnapshot,
} from "@/lib/scan-ledger/types";
export { SCAN_STUB } from "@/lib/scan-ledger/types";
export {
  SCAN_PREVIEW_STATES,
  isScanPreviewState,
  scanPreview,
} from "@/lib/scan-ledger/preview";
export {
  allCodesEntered,
  bookPointsFromPlates,
  cellPoints,
  deriveBookRow,
  deriveCodeOutcome,
  emptyPlates,
  folioLine,
  isPlausiblePageCode,
  normalizeBookCode,
  plateIndex,
  plateLabel,
  storyBarWidth,
} from "@/lib/scan-ledger/state";
export {
  CAMERA_BLOCKED,
  CAMERA_INSECURE,
  CELL_LABEL,
  PHOTO_OPTIONAL,
  SCAN_BOOK_TROPHY_LABEL,
  SCAN_OPT_LINE,
  SCAN_SAMPLE_NOTE,
  SCAN_SPEND_NOTE,
  SCAN_WALLET_FROM_POINTS,
  SCAN_WALLET_LABEL,
  codeInMessage,
  collectedMessage,
  invalidCodeMessage,
  sampleNote,
  scanChrome,
  systemErrorMessage,
  trophyPlateCaption,
} from "@/lib/scan-ledger/copy";
export {
  SAMPLE_BAD_CODE,
  SAMPLE_PAGE,
  SAMPLE_SILVER,
  SAMPLE_STORY,
  SAMPLE_UNLOCK,
  createFixtureAdapter,
  fixtureActivePlate,
  fixtureSnapshot,
} from "@/lib/scan-ledger/fixture";
export {
  booksFromExistingRows,
  createLiveAdapter,
  registerBookStubMessage,
  walletFromProfile,
} from "@/lib/scan-ledger/live";
export {
  legendaryCaption,
  legendaryRarityNote,
  tierTrophyPosterUrl,
  tierTrophyUrl,
  TIER_TROPHY_MODELS,
  TIER_TROPHY_POSTERS,
} from "@/lib/scan-ledger/trophies";
