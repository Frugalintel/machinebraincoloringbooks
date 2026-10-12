import type { ReviewFields } from "@/lib/review/manifest";
import type {
  ReviewBookPayload,
  ReviewDraft,
  ReviewFlag,
  ReviewInsert,
  ReviewSubmissionPayload,
} from "@/lib/review/types";

export function createDraftFromBook(book: ReviewBookPayload): ReviewDraft {
  const fields: Record<string, ReviewFields> = {
    cover: { ...book.cover.fields },
  };
  for (const matter of [...book.frontMatter, ...book.backMatter]) {
    fields[matter.id] = { ...matter.fields };
  }
  return {
    order: book.pages.map((page) => page.id),
    deleted: [],
    flags: {},
    inserts: [],
    fields,
    uploads: [],
  };
}

export function mergeDraft(
  base: ReviewDraft,
  stored: Partial<ReviewDraft> | null,
): ReviewDraft {
  if (!stored) {
    return base;
  }
  const knownIds = new Set([...base.order, ...base.deleted]);
  const storedOrder = Array.isArray(stored.order)
    ? stored.order.filter((id) => typeof id === "string")
    : [];
  const storedInserts = Array.isArray(stored.inserts) ? stored.inserts : [];
  const insertIds = new Set(
    storedInserts
      .filter((item): item is ReviewInsert => Boolean(item && item.id))
      .map((item) => item.id),
  );
  const mergedOrder = [
    ...storedOrder.filter((id) => knownIds.has(id) || insertIds.has(id)),
    ...base.order.filter((id) => !storedOrder.includes(id)),
  ];
  return {
    order: mergedOrder.length > 0 ? mergedOrder : base.order,
    deleted: Array.isArray(stored.deleted)
      ? stored.deleted.filter((id) => knownIds.has(id))
      : [],
    flags: stored.flags && typeof stored.flags === "object" ? stored.flags : {},
    inserts: storedInserts.filter((item): item is ReviewInsert =>
      Boolean(item && typeof item.id === "string"),
    ),
    fields: {
      ...base.fields,
      ...(stored.fields && typeof stored.fields === "object"
        ? stored.fields
        : {}),
    },
    uploads: Array.isArray(stored.uploads)
      ? stored.uploads.filter((item) => typeof item === "string")
      : [],
  };
}

export function buildSubmissionPayload(
  draft: ReviewDraft,
  submittedAt = new Date().toISOString(),
): ReviewSubmissionPayload {
  return {
    order: draft.order,
    deleted: draft.deleted,
    flags: draft.flags,
    inserts: draft.inserts,
    fields: draft.fields,
    uploads: draft.uploads,
    submitted_at: submittedAt,
  };
}

export function normalizeFlags(
  flags: Record<string, ReviewFlag>,
): Record<string, ReviewFlag> {
  const next: Record<string, ReviewFlag> = {};
  for (const [id, value] of Object.entries(flags)) {
    next[id] = {
      flag: Boolean(value?.flag),
      note: typeof value?.note === "string" ? value.note : "",
    };
  }
  return next;
}

export function draftStorageKey(slug: string): string {
  return `book-review-draft:${slug}`;
}

export function parseStoredDraft(
  raw: string | null,
): Partial<ReviewDraft> | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Partial<ReviewDraft>;
  } catch {
    return null;
  }
}

export function moveId(order: string[], id: string, delta: number): string[] {
  const index = order.indexOf(id);
  if (index === -1) {
    return order;
  }
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= order.length) {
    return order;
  }
  const next = [...order];
  const [removed] = next.splice(index, 1);
  if (removed) {
    next.splice(nextIndex, 0, removed);
  }
  return next;
}
