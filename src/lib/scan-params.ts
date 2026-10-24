/** Book codes are stored upper case; typed and scanned input may not be. */
export function normalizeBookCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export type ScanEntry = { mode: "code"; code: string } | { mode: "camera" };

/**
 * `/scan?mode=code&code=ab12` (the home "Type it in." form) opens manual
 * entry with the code prefilled. Anything else keeps the camera flow.
 */
export function scanEntryFromParams(params: {
  get(name: string): string | null;
}): ScanEntry {
  if (params.get("mode") !== "code") {
    return { mode: "camera" };
  }
  return { mode: "code", code: normalizeBookCode(params.get("code") ?? "") };
}
