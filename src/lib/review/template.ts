import { GOOGLE_FONTS_STYLESHEET } from "@/lib/review/constants";
import type { ReviewFields } from "@/lib/review/manifest";
import {
  isAbsoluteUrl,
  isSrcFieldKey,
  resolveBucketPath,
} from "@/lib/review/paths";

const RELATIVE_URL_ATTR =
  /\b(?:src|href)\s*=\s*(["']?)(?!https?:|data:|blob:|file:|\/\/|#|mailto:|tel:)([^"'>\s]+)\1/gi;
const RELATIVE_CSS_URL =
  /url\(\s*(['"]?)(?!https?:|data:|blob:|file:|\/\/)([^'")]+)\1\s*\)/gi;
const FILE_FONT_FACE = /@font-face\s*\{[^}]*file:\/\/[^}]*\}/gi;
const FIELDS_SCRIPT =
  /<script\s+id=["']fields["']\s+type=["']application\/json["']\s*>[\s\S]*?<\/script>/i;

export function collectRelativeUrls(
  html: string,
  templatePath: string,
): string[] {
  const found = new Set<string>();
  const add = (raw: string) => {
    const resolved = resolveBucketPath(templatePath, raw.trim());
    if (resolved) {
      found.add(resolved);
    }
  };
  html.replace(RELATIVE_URL_ATTR, (_match, _quote, url: string) => {
    add(url);
    return _match;
  });
  html.replace(RELATIVE_CSS_URL, (_match, _quote, url: string) => {
    add(url);
    return _match;
  });
  return [...found];
}

export function collectFieldAssetPaths(
  fields: ReviewFields,
  templatePath: string,
): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (!isSrcFieldKey(key) || typeof value !== "string" || !value) {
      continue;
    }
    if (isAbsoluteUrl(value)) {
      continue;
    }
    const resolved = resolveBucketPath(templatePath, value);
    if (resolved) {
      paths.push(resolved);
    }
  }
  return paths;
}

export function replaceFileFonts(html: string): string {
  const withoutFileFonts = html.replace(FILE_FONT_FACE, "");
  const remapped = withoutFileFonts
    .replace(/font-family:\s*Cormorant\b/g, "font-family:'Cormorant Garamond'")
    .replace(/font-family:\s*LoraV\b/g, "font-family:Lora");
  if (/<head[^>]*>/i.test(remapped)) {
    return remapped.replace(
      /<head([^>]*)>/i,
      `<head$1><link rel="stylesheet" href="${GOOGLE_FONTS_STYLESHEET}">`,
    );
  }
  return `<link rel="stylesheet" href="${GOOGLE_FONTS_STYLESHEET}">${remapped}`;
}

export function rewriteRelativeUrls(
  html: string,
  templatePath: string,
  signedUrls: Record<string, string>,
): string {
  const replaceUrl = (raw: string): string => {
    const resolved = resolveBucketPath(templatePath, raw.trim());
    if (!resolved) {
      return raw;
    }
    return signedUrls[resolved] ?? raw;
  };
  const withAttrs = html.replace(
    RELATIVE_URL_ATTR,
    (match, quote: string, url: string) => {
      const next = replaceUrl(url);
      if (next === url) {
        return match;
      }
      const q = quote || '"';
      const attr = match.slice(0, match.indexOf("="));
      return `${attr}=${q}${next}${q}`;
    },
  );
  return withAttrs.replace(
    RELATIVE_CSS_URL,
    (match, quote: string, url: string) => {
      const next = replaceUrl(url);
      if (next === url) {
        return match;
      }
      return `url(${quote}${next}${quote})`;
    },
  );
}

export function serializeFieldsJson(fields: ReviewFields): string {
  return JSON.stringify(fields).replace(/<\//g, "<\\/");
}

export function injectFields(html: string, fields: ReviewFields): string {
  const block = `<script id="fields" type="application/json">${serializeFieldsJson(fields)}</script>`;
  if (FIELDS_SCRIPT.test(html)) {
    return html.replace(FIELDS_SCRIPT, block);
  }
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${block}</body>`);
  }
  return `${html}${block}`;
}

export function resolveFieldsForPreview(
  fields: ReviewFields,
  templatePath: string,
  signedUrls: Record<string, string>,
): ReviewFields {
  const resolved: ReviewFields = { ...fields };
  for (const [key, value] of Object.entries(resolved)) {
    if (!isSrcFieldKey(key) || typeof value !== "string" || !value) {
      continue;
    }
    if (isAbsoluteUrl(value)) {
      continue;
    }
    const storagePath = resolveBucketPath(templatePath, value);
    if (storagePath && signedUrls[storagePath]) {
      resolved[key] = signedUrls[storagePath];
    } else if (signedUrls[value]) {
      resolved[key] = signedUrls[value];
    }
  }
  return resolved;
}

export function prepareTemplateHtml(
  html: string,
  templatePath: string,
  signedUrls: Record<string, string>,
): string {
  return rewriteRelativeUrls(replaceFileFonts(html), templatePath, signedUrls);
}

export function renderTemplateSrcdoc(
  preparedHtml: string,
  fields: ReviewFields,
  templatePath: string,
  signedUrls: Record<string, string>,
): string {
  return injectFields(
    preparedHtml,
    resolveFieldsForPreview(fields, templatePath, signedUrls),
  );
}
