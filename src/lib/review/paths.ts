import { REVIEW_SLUG_PATTERN } from "@/lib/review/constants";

export function isAbsoluteUrl(value: string): boolean {
  return /^(https?:|data:|blob:|file:|\/\/)/i.test(value);
}

export function isStoragePath(value: string): boolean {
  return value.startsWith("books/");
}

export function isSrcFieldKey(key: string): boolean {
  return key === "logo_src" || key.endsWith("_src");
}

export function parseReviewSlug(value: string): string | null {
  if (!REVIEW_SLUG_PATTERN.test(value)) {
    return null;
  }
  return value;
}

export function manifestPathForSlug(slug: string): string {
  return `books/${slug}/manifest.json`;
}

export function uploadPathForSlug(slug: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return `books/${slug}/uploads/${Date.now()}-${safeName}`;
}

export function templateDirectory(templatePath: string): string {
  const index = templatePath.lastIndexOf("/");
  return index === -1 ? "" : templatePath.slice(0, index);
}

export function resolveBucketPath(
  fromFile: string,
  relative: string,
): string | null {
  if (!relative || isAbsoluteUrl(relative)) {
    return null;
  }
  const trimmed = relative.split("?")[0]?.split("#")[0] ?? relative;
  if (!trimmed || isAbsoluteUrl(trimmed)) {
    return null;
  }
  if (isStoragePath(trimmed)) {
    return trimmed;
  }
  const dir = templateDirectory(fromFile);
  const parts = dir.split("/").filter(Boolean);
  for (const segment of trimmed.split("/")) {
    if (segment === "" || segment === ".") {
      continue;
    }
    if (segment === "..") {
      if (parts.length === 0) {
        return null;
      }
      parts.pop();
      continue;
    }
    if (segment.includes("\0")) {
      return null;
    }
    parts.push(segment);
  }
  const resolved = parts.join("/");
  if (!resolved || resolved.includes("..")) {
    return null;
  }
  return resolved;
}

export function assertPathInSlug(path: string, slug: string): boolean {
  return path === `books/${slug}` || path.startsWith(`books/${slug}/`);
}
