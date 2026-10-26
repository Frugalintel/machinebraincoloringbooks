import { describe, expect, it } from "vitest";
import { invalidCodeMessage, systemErrorMessage } from "@/lib/scan-ledger/copy";
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
  selects?: { table: string; columns: string }[];
  rpc?: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
  rpcCalls?: { fn: string; args: Record<string, unknown> }[];
  storage?: {
    from: (bucket: string) => {
      upload: (path: string, file: Blob) => PromiseLike<{ error: unknown }>;
    };
  };
}) {
  const inserts = options?.inserts ?? [];
  const selects = options?.selects ?? [];
  const rpcCalls = options?.rpcCalls ?? [];
  return {
    from(table: string) {
      return {
        select(columns: string) {
          selects.push({ table, columns });
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
    ...(options?.rpc
      ? {
          async rpc(fn: string, args: Record<string, unknown>) {
            rpcCalls.push({ fn, args });
            return options.rpc!(fn, args);
          },
        }
      : {}),
    ...(options?.storage ? { storage: options.storage } : {}),
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

  it("holds a signed-out page code without leaking the plate number", async () => {
    const inserts: { table: string; row: unknown }[] = [];
    const adapter = createLiveAdapter(
      memoryClient({
        inserts,
        bookCode: {
          id: "code-1",
          code: "7KQ2",
          page_number: 7,
          is_active: true,
          products: { title: "The Silver Citadel" },
        },
      }),
    );
    const result = await adapter.submitPageCode({
      userId: null,
      code: "7kq2",
    });
    expect(result).toMatchObject({
      ok: false,
      kind: "signed-out",
      hold: { kind: "page-plus", label: "7KQ2" },
    });
    if (result.ok || result.kind !== "signed-out") return;
    expect(result.hold.label).not.toMatch(/plate|pl\.|07/i);
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

  it("rejects a kind book code on the page path without writing", async () => {
    const inserts: { table: string; row: unknown }[] = [];
    const adapter = createLiveAdapter(
      memoryClient({
        inserts,
        bookCode: {
          id: "code-book",
          code: "QA-TEST-BOOK",
          kind: "book",
          is_active: true,
          products: { id: "p1", title: "The Silver Citadel" },
        },
      }),
    );
    const result = await adapter.submitPageCode({
      userId: "user-1",
      code: "qa-test-book",
    });
    expect(result).toEqual({
      ok: false,
      kind: "invalid",
      code: "QA-TEST-BOOK",
      message: invalidCodeMessage("QA-TEST-BOOK"),
    });
    expect(inserts).toEqual([]);
  });

  it("selects only total_xp from profiles", async () => {
    const selects: { table: string; columns: string }[] = [];
    const adapter = createLiveAdapter(memoryClient({ selects }));
    await adapter.getLedger("user-1");
    const profileSelects = selects.filter((row) => row.table === "profiles");
    expect(profileSelects.length).toBeGreaterThan(0);
    for (const select of profileSelects) {
      expect(select.columns).toBe("total_xp");
      expect(select.columns).not.toMatch(/\bpoints\b|\bpoint_balance\b/);
    }
  });
});

describe("createLiveAdapter registerBook", () => {
  it("returns registered when the rpc reports registered", async () => {
    const inserts: { table: string; row: unknown }[] = [];
    const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];
    const adapter = createLiveAdapter(
      memoryClient({
        inserts,
        rpcCalls,
        rpc: async () => ({
          data: { status: "registered", product_id: "prod-1" },
          error: null,
        }),
      }),
    );
    const result = await adapter.registerBook({
      userId: "user-1",
      code: " qa-test-book ",
    });
    expect(rpcCalls).toEqual([
      { fn: "register_book", args: { p_code: "QA-TEST-BOOK" } },
    ]);
    expect(inserts).toEqual([]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kind).toBe("registered");
    expect(result.snapshot.signedIn).toBe(true);
  });

  it("reuses registered when the rpc reports already_registered", async () => {
    const adapter = createLiveAdapter(
      memoryClient({
        rpc: async () => ({
          data: { status: "already_registered", product_id: "prod-1" },
          error: null,
        }),
      }),
    );
    const result = await adapter.registerBook({
      userId: "user-1",
      code: "QA-TEST-BOOK",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kind).toBe("registered");
    expect(result.snapshot.signedIn).toBe(true);
  });

  it("returns invalid when the rpc reports invalid", async () => {
    const adapter = createLiveAdapter(
      memoryClient({
        rpc: async () => ({
          data: { status: "invalid", product_id: null },
          error: null,
        }),
      }),
    );
    const result = await adapter.registerBook({
      userId: "user-1",
      code: "NOPE",
    });
    expect(result).toEqual({
      ok: false,
      kind: "invalid",
      code: "NOPE",
      message: invalidCodeMessage("NOPE"),
    });
  });

  it("returns signed-out when the rpc reports unauthenticated", async () => {
    const adapter = createLiveAdapter(
      memoryClient({
        rpc: async () => ({
          data: { status: "unauthenticated", product_id: null },
          error: null,
        }),
      }),
    );
    const result = await adapter.registerBook({
      userId: "user-1",
      code: "QA-TEST-BOOK",
    });
    expect(result).toEqual({
      ok: false,
      kind: "signed-out",
      hold: { kind: "book", label: "QA-TEST-BOOK" },
    });
  });

  it("returns a generic error when the rpc errors", async () => {
    const adapter = createLiveAdapter(
      memoryClient({
        rpc: async () => ({
          data: null,
          error: { message: "boom" },
        }),
      }),
    );
    const result = await adapter.registerBook({
      userId: "user-1",
      code: "QA-TEST-BOOK",
    });
    expect(result).toEqual({
      ok: false,
      kind: "error",
      message: systemErrorMessage(),
    });
  });

  it("holds a signed-out book scan without calling the rpc", async () => {
    const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];
    const adapter = createLiveAdapter(
      memoryClient({
        rpcCalls,
        rpc: async () => ({
          data: { status: "registered", product_id: "prod-1" },
          error: null,
        }),
      }),
    );
    const result = await adapter.registerBook({
      userId: null,
      code: "QA-TEST-BOOK",
    });
    expect(result).toEqual({
      ok: false,
      kind: "signed-out",
      hold: { kind: "book", label: "QA-TEST-BOOK" },
    });
    expect(rpcCalls).toEqual([]);
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

  it("keeps the scanned plate on a P01 photo instead of the Plate 07 fixture", async () => {
    const adapter = createLiveAdapter(
      memoryClient({
        bookCode: {
          id: "code-1",
          code: "P01",
          page_number: 1,
          is_active: true,
          kind: "page",
          products: { title: "The Silver Citadel" },
        },
        storage: {
          from: () => ({
            upload: async () => ({ error: null }),
          }),
        },
      }),
    );
    const result = await adapter.submitPagePhoto({
      userId: "user-1",
      code: "P01",
      image: new Blob(["x"], { type: "image/jpeg" }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kind).toBe("pending");
    expect(result.snapshot.activePlate?.plate).toBe("01");
    expect(result.snapshot.activePlate?.plate).not.toBe("07");
  });
});
