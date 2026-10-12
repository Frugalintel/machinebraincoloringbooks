export type ReviewFieldValue = string | boolean | number;
export type ReviewFields = Record<string, ReviewFieldValue>;

export type ManifestPage = {
  id: string;
  number: number;
  color?: string;
  line_png?: string;
  line_svg?: string;
  approved_source?: string;
  status?: string;
};

export type ManifestMatter = {
  id: string;
  template: string;
  fields_default: ReviewFields;
  zones?: string;
  preview?: string;
  width: number;
  height: number;
};

export type ManifestCover = {
  template: string;
  fields_default: ReviewFields;
  fields_placeholder?: string;
  zones?: string;
  width: number;
  height: number;
  folds_x: number[];
  preview_wrap?: string;
  preview_front?: string;
  parts: string[];
};

export type BookManifest = {
  slug: string;
  title: string;
  version: number;
  trim: {
    in: number[];
    page_count: number;
  };
  asset_base?: string;
  cover: ManifestCover;
  front_matter: ManifestMatter[];
  pages: ManifestPage[];
  back_matter: ManifestMatter[];
  extra_templates?: ManifestMatter[];
  template_notes?: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asFields(value: unknown): ReviewFields {
  if (!isPlainObject(value)) {
    return {};
  }
  const fields: ReviewFields = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    if (
      typeof fieldValue === "string" ||
      typeof fieldValue === "boolean" ||
      typeof fieldValue === "number"
    ) {
      fields[key] = fieldValue;
    }
  }
  return fields;
}

function asMatter(value: unknown): ManifestMatter | null {
  if (!isPlainObject(value)) {
    return null;
  }
  if (typeof value.id !== "string" || typeof value.template !== "string") {
    return null;
  }
  return {
    id: value.id,
    template: value.template,
    fields_default: asFields(value.fields_default),
    zones: typeof value.zones === "string" ? value.zones : undefined,
    preview: typeof value.preview === "string" ? value.preview : undefined,
    width: typeof value.width === "number" ? value.width : 2588,
    height: typeof value.height === "number" ? value.height : 3375,
  };
}

function asPage(value: unknown): ManifestPage | null {
  if (!isPlainObject(value)) {
    return null;
  }
  if (typeof value.id !== "string") {
    return null;
  }
  return {
    id: value.id,
    number: typeof value.number === "number" ? value.number : 0,
    color: typeof value.color === "string" ? value.color : undefined,
    line_png: typeof value.line_png === "string" ? value.line_png : undefined,
    line_svg: typeof value.line_svg === "string" ? value.line_svg : undefined,
    approved_source:
      typeof value.approved_source === "string"
        ? value.approved_source
        : undefined,
    status: typeof value.status === "string" ? value.status : undefined,
  };
}

export function parseManifest(data: unknown): BookManifest {
  if (!isPlainObject(data)) {
    throw new Error("Manifest must be a JSON object");
  }
  if (typeof data.slug !== "string" || !data.slug) {
    throw new Error("Manifest is missing slug");
  }
  if (!isPlainObject(data.cover) || typeof data.cover.template !== "string") {
    throw new Error("Manifest is missing cover.template");
  }
  const folds = Array.isArray(data.cover.folds_x)
    ? data.cover.folds_x.filter((item): item is number => typeof item === "number")
    : [2588, 2631];
  const parts = Array.isArray(data.cover.parts)
    ? data.cover.parts.filter((item): item is string => typeof item === "string")
    : ["front", "spine", "back"];

  return {
    slug: data.slug,
    title: typeof data.title === "string" ? data.title : data.slug,
    version: typeof data.version === "number" ? data.version : 1,
    trim: {
      in: Array.isArray(data.trim) || !isPlainObject(data.trim)
        ? [8.5, 11]
        : Array.isArray(data.trim.in)
          ? data.trim.in.filter((item): item is number => typeof item === "number")
          : [8.5, 11],
      page_count:
        isPlainObject(data.trim) && typeof data.trim.page_count === "number"
          ? data.trim.page_count
          : 64,
    },
    asset_base: typeof data.asset_base === "string" ? data.asset_base : undefined,
    cover: {
      template: data.cover.template,
      fields_default: asFields(data.cover.fields_default),
      fields_placeholder:
        typeof data.cover.fields_placeholder === "string"
          ? data.cover.fields_placeholder
          : undefined,
      zones: typeof data.cover.zones === "string" ? data.cover.zones : undefined,
      width: typeof data.cover.width === "number" ? data.cover.width : 5219,
      height: typeof data.cover.height === "number" ? data.cover.height : 3375,
      folds_x: folds.length >= 2 ? folds : [2588, 2631],
      preview_wrap:
        typeof data.cover.preview_wrap === "string"
          ? data.cover.preview_wrap
          : undefined,
      preview_front:
        typeof data.cover.preview_front === "string"
          ? data.cover.preview_front
          : undefined,
      parts,
    },
    front_matter: Array.isArray(data.front_matter)
      ? data.front_matter
          .map(asMatter)
          .filter((item): item is ManifestMatter => item !== null)
      : [],
    pages: Array.isArray(data.pages)
      ? data.pages
          .map(asPage)
          .filter((item): item is ManifestPage => item !== null)
      : [],
    back_matter: Array.isArray(data.back_matter)
      ? data.back_matter
          .map(asMatter)
          .filter((item): item is ManifestMatter => item !== null)
      : [],
    extra_templates: Array.isArray(data.extra_templates)
      ? data.extra_templates
          .map(asMatter)
          .filter((item): item is ManifestMatter => item !== null)
      : [],
    template_notes:
      typeof data.template_notes === "string" ? data.template_notes : undefined,
  };
}

export function collectManifestAssetPaths(manifest: BookManifest): string[] {
  const paths = new Set<string>();
  const add = (value: string | undefined) => {
    if (value && !value.startsWith("http") && !value.startsWith("data:")) {
      paths.add(value);
    }
  };
  add(manifest.cover.template);
  add(manifest.cover.preview_wrap);
  add(manifest.cover.preview_front);
  for (const matter of [
    ...manifest.front_matter,
    ...manifest.back_matter,
    ...(manifest.extra_templates ?? []),
  ]) {
    add(matter.template);
    add(matter.preview);
    add(matter.zones);
  }
  for (const page of manifest.pages) {
    add(page.color);
    add(page.line_png);
    add(page.line_svg);
  }
  return [...paths];
}
