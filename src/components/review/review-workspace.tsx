"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Flag,
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { FieldEditor } from "@/components/review/field-editor";
import {
  CoverWrapPreview,
  ScaledTemplate,
} from "@/components/review/scaled-template";
import { Button } from "@/components/ui/button";
import type { ReviewFieldValue, ReviewFields } from "@/lib/review/manifest";
import {
  buildSubmissionPayload,
  createDraftFromBook,
  draftStorageKey,
  mergeDraft,
  moveId,
} from "@/lib/review/payload";
import { renderTemplateSrcdoc } from "@/lib/review/template";
import type {
  ReviewBookPayload,
  ReviewDraft,
  ReviewInsert,
  ReviewPageView,
} from "@/lib/review/types";

function useDebouncedDraft(slug: string, draft: ReviewDraft | null) {
  useEffect(() => {
    if (!draft) {
      return;
    }
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(draftStorageKey(slug), JSON.stringify(draft));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft, slug]);
}

function SortablePageCard({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`rounded-lg border border-[#2a2a2a] bg-[#101010] p-4 ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      <div className="mb-3 flex justify-start">
        <button
          type="button"
          className="rounded p-2 text-muted-foreground hover:bg-[#1a1a1a]"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
      </div>
      {children}
    </article>
  );
}

export function ReviewWorkspace({ slug }: { slug: string }) {
  const [book, setBook] = useState<ReviewBookPayload | null>(null);
  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [insertOpen, setInsertOpen] = useState(false);
  const [insertAfter, setInsertAfter] = useState<string | null>(null);
  const [insertDescription, setInsertDescription] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useDebouncedDraft(slug, draft);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/review/${slug}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error || "Failed to load book");
        }
        const payload = (await response.json()) as ReviewBookPayload;
        if (cancelled) {
          return;
        }
        setBook(payload);
        setSignedUrls(payload.signedUrls);
        const base = createDraftFromBook(payload);
        const raw = window.localStorage.getItem(draftStorageKey(slug));
        const stored = raw ? (JSON.parse(raw) as Partial<ReviewDraft>) : null;
        setDraft(mergeDraft(base, stored));
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const updateDraft = useCallback((updater: (current: ReviewDraft) => ReviewDraft) => {
    setDraft((current) => (current ? updater(current) : current));
  }, []);

  const coverSrcdoc = useMemo(() => {
    if (!book || !draft) {
      return "";
    }
    return renderTemplateSrcdoc(
      book.cover.preparedHtml,
      draft.fields.cover ?? book.cover.fields,
      book.cover.templatePath,
      signedUrls,
    );
  }, [book, draft, signedUrls]);

  const matterSrcdocs = useMemo(() => {
    const map: Record<string, string> = {};
    if (!book || !draft) {
      return map;
    }
    for (const matter of [...book.frontMatter, ...book.backMatter]) {
      map[matter.id] = renderTemplateSrcdoc(
        matter.preparedHtml,
        draft.fields[matter.id] ?? matter.fields,
        matter.templatePath,
        signedUrls,
      );
    }
    return map;
  }, [book, draft, signedUrls]);

  const pagesById = useMemo(() => {
    const map = new Map<string, ReviewPageView>();
    book?.pages.forEach((page) => map.set(page.id, page));
    return map;
  }, [book]);

  const visibleOrder = useMemo(() => {
    if (!draft) {
      return [];
    }
    const deleted = new Set(draft.deleted);
    return draft.order.filter((id) => !deleted.has(id));
  }, [draft]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    updateDraft((current) => {
      const oldIndex = current.order.indexOf(String(active.id));
      const newIndex = current.order.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) {
        return current;
      }
      return { ...current, order: arrayMove(current.order, oldIndex, newIndex) };
    });
  };

  const changeField = (
    group: string,
    key: string,
    value: ReviewFieldValue,
  ) => {
    updateDraft((current) => ({
      ...current,
      fields: {
        ...current.fields,
        [group]: {
          ...(current.fields[group] ?? {}),
          [key]: value,
        },
      },
    }));
  };

  const uploadField = async (group: string, key: string, file: File) => {
    setUploadingKey(`${group}:${key}`);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/review/${slug}/upload`, {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as {
        path?: string;
        signedUrl?: string;
        error?: string;
      };
      if (!response.ok || !payload.path) {
        throw new Error(payload.error || "Upload failed");
      }
      setSignedUrls((current) =>
        payload.signedUrl
          ? { ...current, [payload.path as string]: payload.signedUrl }
          : current,
      );
      updateDraft((current) => ({
        ...current,
        fields: {
          ...current.fields,
          [group]: {
            ...(current.fields[group] ?? {}),
            [key]: payload.path as string,
          },
        },
        uploads: current.uploads.includes(payload.path as string)
          ? current.uploads
          : [...current.uploads, payload.path as string],
      }));
    } catch (uploadError) {
      setSubmitMessage(
        uploadError instanceof Error ? uploadError.message : "Upload failed",
      );
    } finally {
      setUploadingKey(null);
    }
  };

  const submit = async () => {
    if (!draft) {
      return;
    }
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const response = await fetch(`/api/review/${slug}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = (await response.json()) as {
        error?: string;
        submission?: { version: number };
      };
      if (!response.ok) {
        throw new Error(payload.error || "Submit failed");
      }
      setSubmitMessage(`Saved version ${payload.submission?.version ?? "?"}`);
    } catch (submitError) {
      setSubmitMessage(
        submitError instanceof Error ? submitError.message : "Submit failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const downloadJson = () => {
    if (!draft) {
      return;
    }
    const payload = buildSubmissionPayload(draft);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slug}-review.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const confirmInsert = () => {
    if (!insertDescription.trim()) {
      return;
    }
    const insert: ReviewInsert = {
      id: `insert-${crypto.randomUUID()}`,
      after: insertAfter,
      description: insertDescription.trim(),
    };
    updateDraft((current) => {
      const nextOrder = [...current.order];
      const afterIndex = insert.after
        ? nextOrder.indexOf(insert.after)
        : -1;
      nextOrder.splice(afterIndex + 1, 0, insert.id);
      return {
        ...current,
        order: nextOrder,
        inserts: [...current.inserts, insert],
      };
    });
    setInsertAfter(null);
    setInsertDescription("");
    setInsertOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} />
        Loading book…
      </div>
    );
  }

  if (error || !book || !draft) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="font-heading text-2xl uppercase">Review unavailable</h1>
        <p className="mt-3 text-sm text-destructive">
          {error || "Book data is missing."}
        </p>
      </main>
    );
  }

  const renderMatter = (
    matter: ReviewBookPayload["frontMatter"][number],
    heading: string,
  ) => (
    <section key={matter.id} className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
            {heading}
          </p>
          <h2 className="font-heading text-xl uppercase">{matter.id}</h2>
        </div>
      </div>
      <ScaledTemplate
        srcdoc={matterSrcdocs[matter.id] ?? ""}
        width={matter.width}
        height={matter.height}
        title={`${heading} ${matter.id}`}
      />
      <FieldEditor
        fields={(draft.fields[matter.id] ?? matter.fields) as ReviewFields}
        onChange={(key, value) => changeField(matter.id, key, value)}
        onUpload={(key, file) => void uploadField(matter.id, key, file)}
        uploadingKey={
          uploadingKey?.startsWith(`${matter.id}:`)
            ? uploadingKey.slice(matter.id.length + 1)
            : null
        }
      />
    </section>
  );

  return (
    <main className="pb-24">
      <header className="sticky top-0 z-30 border-b border-[#222] bg-[#0b0b0b]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
              Book review
            </p>
            <h1 className="font-heading text-xl uppercase md:text-2xl">
              {book.title}
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              {book.slug} · {book.trim.page_count} pages · {book.trim.in.join("×")}
              in
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={downloadJson}
            >
              <Download size={16} />
              Download JSON
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
              Submit
            </Button>
            <form action="/api/review/logout" method="post">
              <input type="hidden" name="next" value={`/review/${slug}`} />
              <Button type="submit" variant="secondary">
                Lock
              </Button>
            </form>
          </div>
        </div>
        {submitMessage ? (
          <p className="mx-auto max-w-6xl px-4 pb-3 text-sm text-muted-foreground">
            {submitMessage}
          </p>
        ) : null}
      </header>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
        <section className="space-y-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
              Cover
            </p>
            <h2 className="font-heading text-xl uppercase">
              Front · spine · back
            </h2>
            <p className="text-xs text-muted-foreground">
              Wrap {book.cover.width}×{book.cover.height} · folds at{" "}
              {book.cover.foldsX.join(" / ")}
            </p>
          </div>
          <CoverWrapPreview
            srcdoc={coverSrcdoc}
            width={book.cover.width}
            height={book.cover.height}
            foldsX={book.cover.foldsX}
            title="Cover wrap"
          />
          <FieldEditor
            fields={draft.fields.cover ?? book.cover.fields}
            onChange={(key, value) => changeField("cover", key, value)}
            onUpload={(key, file) => void uploadField("cover", key, file)}
            uploadingKey={
              uploadingKey?.startsWith("cover:")
                ? uploadingKey.slice("cover:".length)
                : null
            }
          />
        </section>

        {book.frontMatter.map((matter) => renderMatter(matter, "Front matter"))}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
                Pages
              </p>
              <h2 className="font-heading text-xl uppercase">
                Color · line art
              </h2>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setInsertAfter(null);
                setInsertOpen(true);
              }}
            >
              <Plus size={16} />
              Insert at start
            </Button>
          </div>

          {insertOpen ? (
            <div className="rounded-md border border-[#333] bg-[#111] p-4">
              <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">
                New page description
                <textarea
                  value={insertDescription}
                  onChange={(event) => setInsertDescription(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded border border-[#333] bg-[#0b0b0b] px-2 py-2 text-sm text-foreground"
                />
              </label>
              <div className="mt-3 flex gap-2">
                <Button type="button" onClick={confirmInsert}>
                  Insert
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setInsertAfter(null);
                    setInsertDescription("");
                    setInsertOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleOrder}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {visibleOrder.map((id, index) => {
                  const page = pagesById.get(id);
                  const insert = draft.inserts.find((item) => item.id === id);
                  const flag = draft.flags[id] ?? { flag: false, note: "" };
                  return (
                    <SortablePageCard key={id} id={id}>
                      <div className="w-full space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-heading text-lg uppercase">
                            {page
                              ? `Page ${page.number}`
                              : insert
                                ? "Inserted page"
                                : id}
                          </h3>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              aria-label="Move up"
                              onClick={() =>
                                updateDraft((current) => ({
                                  ...current,
                                  order: moveId(current.order, id, -1),
                                }))
                              }
                            >
                              <ChevronUp size={16} />
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              aria-label="Move down"
                              onClick={() =>
                                updateDraft((current) => ({
                                  ...current,
                                  order: moveId(current.order, id, 1),
                                }))
                              }
                            >
                              <ChevronDown size={16} />
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant={flag.flag ? "default" : "outline"}
                              aria-label="Flag page"
                              onClick={() =>
                                updateDraft((current) => ({
                                  ...current,
                                  flags: {
                                    ...current.flags,
                                    [id]: { ...flag, flag: !flag.flag },
                                  },
                                }))
                              }
                            >
                              <Flag size={16} />
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              aria-label="Insert page after this one"
                              onClick={() => {
                                setInsertAfter(id);
                                setInsertOpen(true);
                              }}
                            >
                              <Plus size={16} />
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="destructive"
                              aria-label="Delete page"
                              onClick={() =>
                                updateDraft((current) => ({
                                  ...current,
                                  deleted: current.deleted.includes(id)
                                    ? current.deleted
                                    : [...current.deleted, id],
                                }))
                              }
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                        {page ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            <figure className="space-y-2">
                              {page.colorUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={page.colorUrl}
                                  alt={`Color art for page ${page.number}`}
                                  className="w-full rounded border border-[#222] bg-white"
                                  loading={index < 4 ? "eager" : "lazy"}
                                />
                              ) : (
                                <div className="flex aspect-[8.5/11] items-center justify-center rounded border border-dashed border-[#333] text-xs text-muted-foreground">
                                  No color art
                                </div>
                              )}
                              <figcaption className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                Color
                              </figcaption>
                            </figure>
                            <figure className="space-y-2">
                              {page.linePngUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={page.linePngUrl}
                                  alt={`Line art for page ${page.number}`}
                                  className="w-full rounded border border-[#222] bg-white"
                                  loading={index < 4 ? "eager" : "lazy"}
                                />
                              ) : (
                                <div className="flex aspect-[8.5/11] items-center justify-center rounded border border-dashed border-[#333] text-xs text-muted-foreground">
                                  No line art
                                </div>
                              )}
                              <figcaption className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                <span>Line art</span>
                                {page.lineSvgUrl ? (
                                  <a
                                    href={page.lineSvgUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline-offset-2 hover:underline"
                                  >
                                    SVG
                                  </a>
                                ) : null}
                              </figcaption>
                            </figure>
                          </div>
                        ) : (
                          <p className="rounded border border-dashed border-[#333] p-4 text-sm">
                            {insert?.description || "Inserted page"}
                          </p>
                        )}
                        <label className="block text-xs text-muted-foreground">
                          Note
                          <textarea
                            value={flag.note}
                            onChange={(event) =>
                              updateDraft((current) => ({
                                ...current,
                                flags: {
                                  ...current.flags,
                                  [id]: { ...flag, note: event.target.value },
                                },
                              }))
                            }
                            rows={2}
                            className="mt-1 w-full rounded border border-[#333] bg-[#0b0b0b] px-2 py-2 text-sm text-foreground"
                          />
                        </label>
                      </div>
                    </SortablePageCard>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        {draft.deleted.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-heading text-xl uppercase">Deleted</h2>
            <p className="text-sm text-muted-foreground">
              Soft-deleted pages stay in the payload until you undo them.
            </p>
            <ul className="space-y-2">
              {draft.deleted.map((id) => (
                <li
                  key={id}
                  className="flex items-center justify-between rounded border border-[#333] bg-[#111] px-3 py-2"
                >
                  <span className="font-mono text-sm">{id}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateDraft((current) => ({
                        ...current,
                        deleted: current.deleted.filter((item) => item !== id),
                      }))
                    }
                  >
                    <RotateCcw size={14} />
                    Undo
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {book.backMatter.map((matter) => renderMatter(matter, "Back matter"))}
      </div>
    </main>
  );
}
