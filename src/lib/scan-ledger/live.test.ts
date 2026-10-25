import { describe, expect, it } from "vitest";
import { SCAN_STUB } from "@/lib/scan-ledger/types";
import {
  booksFromExistingRows,
  createLiveAdapter,
  walletFromProfile,
} from "@/lib/scan-ledger/live";

function memoryClient(options?: {
  bookCode?: Record<string, unknown> | null;
  userCode?: Record<string, unknown> | null;
  scan?: Record<string, unknown> | null;
  inserts?: { table: string; row: unknown }[];
}) {
  const inserts = options?.inserts ?? [];
  return {
    from(table: string) {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        in() {
          return this;
        },
        async maybeSingle() {
          if (table === "book_codes") {
            return { data: options?.bookCode ?? null, error: null };
          }
          if (table === "user_codes") {
            return { data: options?.userCode ?? null, error: null };
          }
          if (table === "page_scans") {
            return { data: options?.scan ?? null, error: null };
          }
          if (table === "profiles") {
            return { data: null, error: null };
          }
          return { data: null, error: null };
        },
        then(resolve: (value: { data: unknown; error: unknown }) => unknown) {
          return Promise.resolve({ data: [], error: null }).then(resolve);
        },
        async insert(row: unknown) {
          inserts.push({ table, row });
          return { error: null };
        },
      };
    },
  };
}

describe("walletFromProfile", () => {
  it("prefers a real points field and otherwise maps XP or marks unavailable", () => {
    expect(walletFromProfile({ points: 14 })).toEqual({
      available: true,
      points: 14,
      source: "points",
    });
    expect(walletFromProfile({ total_xp: 88 })).toEqual({
      available: true,
      points: 88,
      source: "xp",
    });
    expect(walletFromProfile({})).toEqual({
      available: false,
      points: null,
      source: "unavailable",
    });
    expect(walletFromProfile(null).source).toBe("unavailable");
  });
});

describe("createLiveAdapter fail-safe stubs", () => {
  it("never fakes a successful book register for a signed-in user", async () => {
    const inserts: { table: string; row: unknown }[] = [];
    const adapter = createLiveAdapter(memoryClient({ inserts }));
    const result = await adapter.registerBook({
      userId: "user-1",
      code: "MB-SC-SAMPLE",
    });
    expect(result).toEqual({
      ok: false,
      kind: "stub",
      message: SCAN_STUB.register,
    });
    expect(inserts).toEqual([]);
  });

  it("holds a signed-out book scan instead of writing", async () => {
    const inserts: { table: string; row: unknown }[] = [];
    const adapter = createLiveAdapter(memoryClient({ inserts }));
    const result = await adapter.registerBook({
      userId: null,
      code: "MB-SC-SAMPLE",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe("signed-out");
    expect(inserts).toEqual([]);
  });

  it("does not invent a hidden-page or wallet-spend success", async () => {
    const adapter = createLiveAdapter(memoryClient());
    const ledger = await adapter.getLedger("user-1");
    expect(ledger.books.every((book) => book.legendaryFoundAt == null)).toBe(
      true,
    );
    expect(ledger.wallet.source).toBe("unavailable");
    expect(SCAN_STUB.hiddenPage).toMatch(/not on this build/);
    expect(SCAN_STUB.walletSpend).toMatch(/not on this build/);
  });

  it("returns collected when the code and an approved scan already exist", async () => {
    const inserts: { table: string; row: unknown }[] = [];
    const adapter = createLiveAdapter(
      memoryClient({
        inserts,
        bookCode: {
          id: "code-1",
          code: "7KQ2",
          page_number: 7,
          is_active: true,
          products: { id: "p1", title: "The Silver Citadel" },
        },
        userCode: { id: "uc-1" },
        scan: { status: "approved" },
      }),
    );
    const result = await adapter.submitPageCode({
      userId: "user-1",
      code: " 7kq2 ",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kind).toBe("collected");
    expect(inserts).toEqual([]);
  });

  it("looks up the normalized code and rejects unknown ones without writing", async () => {
    const inserts: { table: string; row: unknown }[] = [];
    const adapter = createLiveAdapter(
      memoryClient({ inserts, bookCode: null }),
    );
    const result = await adapter.submitPageCode({
      userId: "user-1",
      code: "7kq3",
    });
    expect(result).toMatchObject({ ok: false, kind: "invalid", code: "7KQ3" });
    expect(inserts).toEqual([]);
  });
});

describe("booksFromExistingRows", () => {
  it("counts a redeemed code as +1 and an approved scan as +1 more", () => {
    const rows = booksFromExistingRows(
      [
        {
          code_id: "a",
          book_codes: {
            id: "a",
            code: "7KQ2",
            page_number: 7,
            product_id: "p1",
            products: { id: "p1", title: "The Silver Citadel" },
          },
        },
        {
          code_id: "b",
          book_codes: {
            id: "b",
            code: "AA11",
            page_number: 1,
            product_id: "p1",
            products: { id: "p1", title: "The Silver Citadel" },
          },
        },
      ],
      [{ code_id: "a", status: "approved" }],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.bookPoints).toBe(3);
    expect(rows[0]?.plates[0]).toBe("code");
    expect(rows[0]?.plates[6]).toBe("verified");
  });
});

describe("live photo stub without storage", () => {
  it("fails safe when the client has no storage bucket", async () => {
    const adapter = createLiveAdapter(
      memoryClient({
        bookCode: {
          id: "code-1",
          code: "7KQ2",
          page_number: 7,
          is_active: true,
          products: { title: "The Silver Citadel" },
        },
      }),
    );
    const result = await adapter.submitPagePhoto({
      userId: "user-1",
      code: "7KQ2",
      image: new Blob(["x"], { type: "image/jpeg" }),
    });
    expect(result).toEqual({
      ok: false,
      kind: "stub",
      message: SCAN_STUB.photoWithoutBackend,
    });
  });
});
