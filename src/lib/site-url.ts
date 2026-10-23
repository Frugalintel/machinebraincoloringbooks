export const DEFAULT_SITE_URL = "https://machinebraincoloringbooks.com";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
).replace(/\/+$/, "");

/** Absolute URL on this site for a root-relative path such as `/scan`. */
export function siteUrl(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error(`siteUrl expects a root-relative path, got "${path}"`);
  }
  return `${SITE_URL}${path}`;
}
