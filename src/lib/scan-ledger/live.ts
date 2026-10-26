import { resolveCollectibleUnlockFromDb } from "@/lib/collectible-unlock";
import { logger } from "@/lib/logger";
import { normalizeBookCode } from "@/lib/scan-params";
import { getStoryPoints } from "@/lib/story-points";
import {
  SCAN_STUB,
  type BookRow,
  type PlateCell,
  type RegisterBookResult,
  type ScanLedgerAdapter,
  type ScanLedgerSnapshot,
  type SubmitPhotoResult,
  type WalletSnapshot,
} from "@/lib/scan-ledger/types";
import {
  deriveBookRow,
  deriveCodeOutcome,
  emptyPlates,
  folioLine,
  isPlausiblePageCode,
  plateIndex,
  plateLabel,
} from "@/lib/scan-ledger/state";
import { invalidCodeMessage, systemErrorMessage } from "@/lib/scan-ledger/copy";

type BookCodeRow = {
  id: string;
  code: string;
  page_number?: number | null;
  product_id?: string | null;
  is_active?: boolean | null;
  unlocks_type?: string | null;
  unlocks_id?: string | null;
  /** Absent or null counts as a page for older rows. */
  kind?: "page" | "book" | string | null;
  products?: {
    id?: string;
    title?: string | null;
    page_count?: number | null;
  } | null;
};

type UserCodeRow = {
  code_id: string;
  book_codes?: BookCodeRow | BookCodeRow[] | null;
};

type PageScanRow = {
  code_id: string;
  status: string | null;
};

type ProfileRow = {
  total_xp?: unknown;
  points?: unknown;
  point_balance?: unknown;
};

export type ScanQueryClient = {
  from: (table: string) => unknown;
  rpc?: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

type FilterBuilder = {
  select: (columns: string) => FilterBuilder;
  eq: (column: string, value: string) => FilterBuilder;
  in: (column: string, values: string[]) => FilterBuilder;
  maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }>;
};

function asFilter(value: unknown): FilterBuilder {
  return value as FilterBuilder;
}

function oneProduct(
  value: BookCodeRow["products"],
): { id?: string; title?: string | null; page_count?: number | null } | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function oneBookCode(value: UserCodeRow["book_codes"]): BookCodeRow | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function walletFromProfile(profile: ProfileRow | null): WalletSnapshot {
  const points = getStoryPoints(null, profile).balance;
  if (points !== undefined) {
    return { available: true, points, source: "points" };
  }
  if (
    typeof profile?.total_xp === "number" &&
    Number.isFinite(profile.total_xp)
  ) {
    return {
      available: true,
      points: Math.max(0, Math.round(profile.total_xp)),
      source: "xp",
    };
  }
  return { available: false, points: null, source: "unavailable" };
}

function plateCellsForBook(
  plateCount: number,
  codes: { page: number; scan: PageScanRow["status"] }[],
): PlateCell[] {
  const plates = emptyPlates(plateCount);
  for (const entry of codes) {
    const i = entry.page - 1;
    if (i < 0 || i >= plateCount) continue;
    if (entry.scan === "approved") plates[i] = "verified";
    else if (entry.scan === "pending") plates[i] = "pending";
    else plates[i] = "code";
  }
  return plates;
}

export function booksFromExistingRows(
  userCodes: UserCodeRow[],
  scans: PageScanRow[],
): BookRow[] {
  const scanByCode = new Map<string, PageScanRow["status"]>();
  for (const scan of scans) {
    const current = scanByCode.get(scan.code_id);
    if (scan.status === "approved" || current == null) {
      scanByCode.set(scan.code_id, scan.status);
    }
  }

  const byBook = new Map<
    string,
    {
      title: string;
      plateCount: number;
      entries: { page: number; scan: PageScanRow["status"] }[];
    }
  >();

  for (const row of userCodes) {
    const code = oneBookCode(row.book_codes);
    if (!code) continue;
    const product = oneProduct(code.products);
    const bookId = product?.id ?? code.product_id ?? code.id;
    const title = product?.title?.trim() || "Untitled book";
    const page = plateIndex(code.page_number);
    if (page == null) continue;
    const existing = byBook.get(bookId) ?? {
      title,
      plateCount: Math.max(page, product?.page_count ?? page),
      entries: [],
    };
    existing.plateCount = Math.max(
      existing.plateCount,
      page,
      product?.page_count ?? 0,
    );
    existing.entries.push({ page, scan: scanByCode.get(code.id) ?? null });
    byBook.set(bookId, existing);
  }

  return [...byBook.entries()].map(([id, book]) =>
    deriveBookRow({
      id,
      title: book.title,
      plates: plateCellsForBook(book.plateCount, book.entries),
    }),
  );
}

async function loadLedger(
  client: ScanQueryClient,
  userId: string | null,
): Promise<ScanLedgerSnapshot> {
  if (!userId) {
    return {
      signedIn: false,
      sample: false,
      wallet: { available: false, points: null, source: "unavailable" },
      story: null,
      books: [],
      showNextBookSlot: true,
      activePlate: null,
      unlock: null,
    };
  }

  const profileQuery = asFilter(client.from("profiles"))
    .select("total_xp")
    .eq("id", userId);
  const codesQuery = asFilter(client.from("user_codes"))
    .select(
      "code_id, book_codes(id, code, page_number, product_id, products(id, title))",
    )
    .eq("user_id", userId);
  const scansQuery = asFilter(client.from("page_scans"))
    .select("code_id, status")
    .eq("user_id", userId);

  const [profileRes, codesRes, scansRes] = await Promise.all([
    profileQuery.maybeSingle(),
    Promise.resolve(
      codesQuery as unknown as PromiseLike<{ data: unknown; error: unknown }>,
    ),
    Promise.resolve(
      scansQuery as unknown as PromiseLike<{ data: unknown; error: unknown }>,
    ),
  ]);

  const userCodes = Array.isArray(codesRes.data)
    ? (codesRes.data as UserCodeRow[])
    : [];
  const scans = Array.isArray(scansRes.data)
    ? (scansRes.data as PageScanRow[])
    : [];

  return {
    signedIn: true,
    sample: false,
    wallet: walletFromProfile((profileRes.data as ProfileRow | null) ?? null),
    story: null,
    books: booksFromExistingRows(userCodes, scans),
    showNextBookSlot: userCodes.length === 0,
    activePlate: null,
    unlock: null,
  };
}

async function lookupBookCode(
  client: ScanQueryClient,
  code: string,
): Promise<BookCodeRow | null> {
  const { data, error } = await asFilter(client.from("book_codes"))
    .select(
      "id, code, page_number, product_id, is_active, unlocks_type, unlocks_id, kind, products(id, title)",
    )
    .eq("code", code)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as BookCodeRow;
  if (row.is_active === false) return null;
  return row;
}

async function existingForUser(
  client: ScanQueryClient,
  userId: string,
  codeId: string,
): Promise<{
  hasCode: boolean;
  scanStatus: "pending" | "approved" | "rejected" | null;
}> {
  const codeRes = await asFilter(client.from("user_codes"))
    .select("id")
    .eq("user_id", userId)
    .eq("code_id", codeId)
    .maybeSingle();
  const scanRes = await asFilter(client.from("page_scans"))
    .select("status")
    .eq("user_id", userId)
    .eq("code_id", codeId)
    .maybeSingle();
  const status = (scanRes.data as { status?: string } | null)?.status;
  const scanStatus =
    status === "pending" || status === "approved" || status === "rejected"
      ? status
      : null;
  return { hasCode: Boolean(codeRes.data), scanStatus };
}

async function redeemUnlocks(
  client: ScanQueryClient,
  userId: string,
  codeData: BookCodeRow,
): Promise<void> {
  if (codeData.unlocks_type === "story" && codeData.unlocks_id) {
    const existing = await asFilter(client.from("user_story_progress"))
      .select("id")
      .eq("user_id", userId)
      .eq("story_id", codeData.unlocks_id)
      .maybeSingle();
    if (!existing.data) {
      const insertable = client.from("user_story_progress") as {
        insert: (row: unknown) => PromiseLike<{ error: unknown }>;
      };
      await insertable.insert({
        user_id: userId,
        story_id: codeData.unlocks_id,
        current_node_id: "start",
      });
    }
    return;
  }
  if (codeData.unlocks_type === "collectible") {
    const unlocked = await resolveCollectibleUnlockFromDb(
      client,
      codeData.unlocks_id ?? undefined,
    );
    if (unlocked) {
      const insertable = client.from("user_collectibles") as {
        insert: (row: unknown) => PromiseLike<{ error: unknown }>;
      };
      await insertable.insert({
        user_id: userId,
        collectible_id: unlocked.slug,
      });
    }
    return;
  }
  if (codeData.unlocks_type === "achievement" && codeData.unlocks_id) {
    const insertable = client.from("user_achievements") as {
      insert: (row: unknown) => PromiseLike<{ error: unknown }>;
    };
    await insertable.insert({
      user_id: userId,
      achievement_id: codeData.unlocks_id,
    });
  }
}

type RegisterBookStatus =
  | "registered"
  | "already_registered"
  | "invalid"
  | "unauthenticated";

function registerBookStatus(data: unknown): RegisterBookStatus | null {
  const status =
    typeof data === "string"
      ? data
      : data && typeof data === "object" && "status" in data
        ? (data as { status?: unknown }).status
        : null;
  switch (status) {
    case "registered":
    case "already_registered":
    case "invalid":
    case "unauthenticated":
      return status;
    default:
      return null;
  }
}

function signedOutBookResult(code: string): RegisterBookResult {
  return {
    ok: false,
    kind: "signed-out",
    hold: { kind: "book", label: code || "This book" },
  };
}

function activeFromCode(codeData: BookCodeRow, code: string) {
  const page = plateIndex(codeData.page_number) ?? 0;
  return {
    plate: page ? plateLabel(page) : "—",
    code,
    title: oneProduct(codeData.products)?.title?.trim() || "Page",
    bookTitle: oneProduct(codeData.products)?.title?.trim() || "Untitled book",
  };
}

export function createLiveAdapter(client: ScanQueryClient): ScanLedgerAdapter {
  return {
    async getLedger(userId) {
      try {
        return await loadLedger(client, userId);
      } catch (error) {
        logger.error("scan ledger load failed", error);
        return {
          signedIn: Boolean(userId),
          sample: false,
          wallet: { available: false, points: null, source: "unavailable" },
          story: null,
          books: [],
          showNextBookSlot: true,
          activePlate: null,
          unlock: null,
        };
      }
    },

    async registerBook({ userId, code }) {
      const normalized = normalizeBookCode(code);
      if (!userId) {
        return signedOutBookResult(normalized);
      }
      if (typeof client.rpc !== "function") {
        return { ok: false, kind: "stub", message: SCAN_STUB.register };
      }

      try {
        const { data, error } = await client.rpc("register_book", {
          p_code: normalized,
        });
        if (error) {
          logger.error("scan book register failed", error);
          return { ok: false, kind: "error", message: systemErrorMessage() };
        }

        const status = registerBookStatus(data);
        switch (status) {
          case "registered":
          case "already_registered": {
            const snapshot = await loadLedger(client, userId);
            return { ok: true, kind: "registered", snapshot };
          }
          case "invalid":
            return {
              ok: false,
              kind: "invalid",
              code: normalized,
              message: invalidCodeMessage(normalized || "That code"),
            };
          case "unauthenticated":
            return signedOutBookResult(normalized);
          case null:
            logger.error("scan book register failed", data);
            return { ok: false, kind: "error", message: systemErrorMessage() };
          default: {
            const _exhaustive: never = status;
            return _exhaustive;
          }
        }
      } catch (error) {
        logger.error("scan book register failed", error);
        return { ok: false, kind: "error", message: systemErrorMessage() };
      }
    },

    async submitPageCode({ userId, code }) {
      const normalized = normalizeBookCode(code);
      if (!normalized || !isPlausiblePageCode(normalized)) {
        return {
          ok: false,
          kind: "invalid",
          code: normalized,
          message: invalidCodeMessage(normalized || "That code"),
        };
      }

      let codeData: BookCodeRow | null;
      try {
        codeData = await lookupBookCode(client, normalized);
      } catch (error) {
        logger.error("scan code lookup failed", error);
        return { ok: false, kind: "error", message: systemErrorMessage() };
      }

      if (!codeData || codeData.kind === "book") {
        return {
          ok: false,
          kind: "invalid",
          code: normalized,
          message: invalidCodeMessage(normalized),
        };
      }

      const plate = activeFromCode(codeData, normalized);
      if (!userId) {
        return {
          ok: false,
          kind: "signed-out",
          hold: {
            kind: "page-plus",
            label: `${folioLine(plate.plate, normalized)} · +1`,
          },
        };
      }

      try {
        const existing = await existingForUser(client, userId, codeData.id);
        const outcome = deriveCodeOutcome(existing);
        if (outcome === "invalid") {
          return {
            ok: false,
            kind: "invalid",
            code: normalized,
            message: invalidCodeMessage(normalized),
          };
        }
        if (outcome !== "code-added") {
          const snapshot = await loadLedger(client, userId);
          return {
            ok: true,
            kind: outcome,
            code: normalized,
            plate,
            snapshot: { ...snapshot, activePlate: plate },
          };
        }

        const insertable = client.from("user_codes") as {
          insert: (row: unknown) => PromiseLike<{ error: unknown }>;
        };
        const { error } = await insertable.insert({
          user_id: userId,
          code_id: codeData.id,
        });
        if (error) {
          logger.error("scan code redeem failed", error);
          return { ok: false, kind: "error", message: systemErrorMessage() };
        }
        await redeemUnlocks(client, userId, codeData);
        const snapshot = await loadLedger(client, userId);
        return {
          ok: true,
          kind: "code-added",
          code: normalized,
          plate,
          snapshot: { ...snapshot, activePlate: plate },
        };
      } catch (error) {
        logger.error("scan code submit failed", error);
        return { ok: false, kind: "error", message: systemErrorMessage() };
      }
    },

    async submitPagePhoto({ userId, code, image }): Promise<SubmitPhotoResult> {
      const normalized = normalizeBookCode(code);
      if (!userId) {
        return {
          ok: false,
          kind: "signed-out",
          hold: {
            kind: "page-plus",
            label: `${folioLine("—", normalized || "CODE")} · +1`,
          },
        };
      }
      if (!normalized) {
        return { ok: false, kind: "error", message: systemErrorMessage() };
      }

      try {
        const codeData = await lookupBookCode(client, normalized);
        if (!codeData || codeData.kind === "book") {
          return { ok: false, kind: "error", message: systemErrorMessage() };
        }

        const storage = (
          client as ScanQueryClient & {
            storage?: {
              from: (bucket: string) => {
                upload: (
                  path: string,
                  file: Blob,
                ) => PromiseLike<{ error: unknown }>;
              };
            };
          }
        ).storage;
        if (!storage) {
          return {
            ok: false,
            kind: "stub",
            message: SCAN_STUB.photoWithoutBackend,
          };
        }

        const filename = `${userId}/${Date.now()}-${normalized}.jpg`;
        const { error: uploadError } = await storage
          .from("page-scans")
          .upload(filename, image);
        if (uploadError) {
          logger.error("scan photo upload failed", uploadError);
          return { ok: false, kind: "error", message: systemErrorMessage() };
        }

        const insertable = client.from("page_scans") as {
          insert: (row: unknown) => PromiseLike<{ error: unknown }>;
        };
        const { error: dbError } = await insertable.insert({
          user_id: userId,
          code_id: codeData.id,
          image_path: filename,
          status: "pending",
        });
        if (dbError) {
          logger.error("scan photo row failed", dbError);
          return { ok: false, kind: "error", message: systemErrorMessage() };
        }

        const snapshot = await loadLedger(client, userId);
        return { ok: true, kind: "pending", snapshot };
      } catch (error) {
        logger.error("scan photo submit failed", error);
        return { ok: false, kind: "error", message: systemErrorMessage() };
      }
    },
  };
}

export function registerBookStubMessage(): string {
  return SCAN_STUB.register;
}
