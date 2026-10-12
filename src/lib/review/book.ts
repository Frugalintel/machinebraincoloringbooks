import type { SupabaseClient } from "@supabase/supabase-js";
import {
  collectFieldAssetPaths,
  collectRelativeUrls,
  prepareTemplateHtml,
} from "@/lib/review/template";
import {
  collectManifestAssetPaths,
  parseManifest,
  type ManifestMatter,
} from "@/lib/review/manifest";
import { assertPathInSlug, parseReviewSlug } from "@/lib/review/paths";
import { downloadBucketText, createSignedUrlMap } from "@/lib/review/signed-urls";
import type {
  ReviewBookPayload,
  ReviewCoverView,
  ReviewMatterView,
} from "@/lib/review/types";

function loadPreparedMatter(
  matter: ManifestMatter,
  slug: string,
  signedUrls: Record<string, string>,
  rawHtml: string,
): ReviewMatterView {
  if (!assertPathInSlug(matter.template, slug)) {
    throw new Error(`Template path escapes book slug: ${matter.template}`);
  }
  return {
    id: matter.id,
    width: matter.width,
    height: matter.height,
    templatePath: matter.template,
    preparedHtml: prepareTemplateHtml(rawHtml, matter.template, signedUrls),
    fields: matter.fields_default,
    previewUrl: matter.preview ? (signedUrls[matter.preview] ?? null) : null,
  };
}

export async function loadReviewBook(
  supabase: SupabaseClient,
  rawSlug: string,
): Promise<ReviewBookPayload> {
  const slug = parseReviewSlug(rawSlug);
  if (!slug) {
    throw new Error("Invalid book slug");
  }
  const manifestPath = `books/${slug}/manifest.json`;
  const manifestJson = await downloadBucketText(supabase, manifestPath);
  const manifest = parseManifest(JSON.parse(manifestJson));
  if (manifest.slug !== slug) {
    throw new Error("Manifest slug does not match requested slug");
  }

  const initialPaths = collectManifestAssetPaths(manifest);
  const templatePaths = [
    manifest.cover.template,
    ...manifest.front_matter.map((item) => item.template),
    ...manifest.back_matter.map((item) => item.template),
  ].filter((path) => assertPathInSlug(path, slug));

  const templates = await Promise.all(
    templatePaths.map(async (path) => ({
      path,
      html: await downloadBucketText(supabase, path),
    })),
  );
  const templateHtmlByPath = new Map(
    templates.map((item) => [item.path, item.html]),
  );

  const discovered = new Set(initialPaths);
  const coverFields = manifest.cover.fields_default;
  for (const path of collectFieldAssetPaths(
    coverFields,
    manifest.cover.template,
  )) {
    if (assertPathInSlug(path, slug)) {
      discovered.add(path);
    }
  }
  for (const htmlEntry of templates) {
    for (const path of collectRelativeUrls(htmlEntry.html, htmlEntry.path)) {
      if (assertPathInSlug(path, slug)) {
        discovered.add(path);
      }
    }
  }
  for (const matter of [...manifest.front_matter, ...manifest.back_matter]) {
    for (const path of collectFieldAssetPaths(
      matter.fields_default,
      matter.template,
    )) {
      if (assertPathInSlug(path, slug)) {
        discovered.add(path);
      }
    }
  }

  const signable = [...discovered].filter(
    (path) => !path.endsWith(".html") && !path.endsWith(".json"),
  );
  const signedUrls = await createSignedUrlMap(supabase, signable);

  const coverHtml = templateHtmlByPath.get(manifest.cover.template);
  if (!coverHtml) {
    throw new Error("Cover template is missing");
  }
  const cover: ReviewCoverView = {
    id: "cover",
    width: manifest.cover.width,
    height: manifest.cover.height,
    templatePath: manifest.cover.template,
    preparedHtml: prepareTemplateHtml(
      coverHtml,
      manifest.cover.template,
      signedUrls,
    ),
    fields: coverFields,
    previewUrl: manifest.cover.preview_wrap
      ? (signedUrls[manifest.cover.preview_wrap] ?? null)
      : null,
    foldsX: manifest.cover.folds_x,
    parts: manifest.cover.parts,
    previewWrapUrl: manifest.cover.preview_wrap
      ? (signedUrls[manifest.cover.preview_wrap] ?? null)
      : null,
    previewFrontUrl: manifest.cover.preview_front
      ? (signedUrls[manifest.cover.preview_front] ?? null)
      : null,
  };

  const frontMatter = manifest.front_matter.map((matter) => {
    const html = templateHtmlByPath.get(matter.template);
    if (!html) {
      throw new Error(`Missing template for ${matter.id}`);
    }
    return loadPreparedMatter(matter, slug, signedUrls, html);
  });
  const backMatter = manifest.back_matter.map((matter) => {
    const html = templateHtmlByPath.get(matter.template);
    if (!html) {
      throw new Error(`Missing template for ${matter.id}`);
    }
    return loadPreparedMatter(matter, slug, signedUrls, html);
  });

  return {
    slug: manifest.slug,
    title: manifest.title,
    version: manifest.version,
    trim: manifest.trim,
    cover,
    frontMatter,
    pages: manifest.pages.map((page) => ({
      id: page.id,
      number: page.number,
      colorUrl: page.color ? (signedUrls[page.color] ?? null) : null,
      linePngUrl: page.line_png ? (signedUrls[page.line_png] ?? null) : null,
      lineSvgUrl: page.line_svg ? (signedUrls[page.line_svg] ?? null) : null,
      status: page.status,
    })),
    backMatter,
    signedUrls,
  };
}
