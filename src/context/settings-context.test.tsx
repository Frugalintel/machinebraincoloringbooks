import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  calls: [] as { table: string; method: string }[],
  campaign: null as Record<string, unknown> | null,
  legacy: null as { value: unknown } | null,
}));

vi.mock("@/lib/supabase", () => {
  function builder(table: string) {
    const api = {
      select() {
        db.calls.push({ table, method: "select" });
        return api;
      },
      eq() {
        db.calls.push({ table, method: "eq" });
        return api;
      },
      order() {
        db.calls.push({ table, method: "order" });
        return api;
      },
      limit() {
        db.calls.push({ table, method: "limit" });
        return api;
      },
      maybeSingle() {
        db.calls.push({ table, method: "maybeSingle" });
        const data = table === "campaigns" ? db.campaign : db.legacy;
        return Promise.resolve({ data, error: null });
      },
      single() {
        db.calls.push({ table, method: "single" });
        return Promise.resolve({
          data: null,
          error: { code: "PGRST116", message: "no rows" },
        });
      },
    };
    return api;
  }

  return {
    supabase: {
      from: (table: string) => builder(table),
      channel: () => ({
        on: () => ({
          subscribe: () => ({}),
        }),
      }),
      removeChannel: () => {},
    },
  };
});

import { SettingsProvider, useSettings } from "@/context/settings-context";

function Probe() {
  const { campaign, isLoading } = useSettings();
  return (
    <p>
      {isLoading ? "loading" : campaign.isActive ? "active" : "inactive"}:
      {campaign.name}
    </p>
  );
}

function sourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...sourceFiles(path));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

describe("SettingsProvider", () => {
  beforeEach(() => {
    db.calls = [];
    db.campaign = null;
    db.legacy = null;
  });

  it("defaults to no active campaign when campaigns and system_settings are empty", async () => {
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );

    expect(
      await screen.findByText("inactive:Default Campaign"),
    ).toBeInTheDocument();
    expect(db.calls.filter((call) => call.method === "single")).toEqual([]);
    expect(db.calls).toEqual(
      expect.arrayContaining([
        { table: "campaigns", method: "maybeSingle" },
        { table: "system_settings", method: "maybeSingle" },
      ]),
    );
  });

  it("uses the active campaign row and skips legacy settings", async () => {
    db.campaign = {
      id: "c1",
      name: "Signal Sale",
      is_active: true,
      settings: {},
    };

    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );

    expect(await screen.findByText("active:Signal Sale")).toBeInTheDocument();
    expect(db.calls.some((call) => call.table === "system_settings")).toBe(
      false,
    );
    expect(db.calls.filter((call) => call.method === "single")).toEqual([]);
  });

  it("maps a legacy system_settings row when no campaign is active", async () => {
    db.legacy = { value: { enabled: true, label: "Shelf Sale" } };

    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );

    expect(await screen.findByText("active:Shelf Sale")).toBeInTheDocument();
  });

  it("keeps the default campaign when the legacy settings value is null", async () => {
    db.legacy = { value: null };

    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );

    expect(
      await screen.findByText("inactive:Default Campaign"),
    ).toBeInTheDocument();
  });
});

describe("campaign and system_settings reads", () => {
  it("does not use a single-object read on either table", () => {
    const singleObject =
      /\.from\(\s*["'](?:campaigns|system_settings)["']\)[\s\S]{0,1200}?\.single\(\)/;
    const offenders = sourceFiles(join(process.cwd(), "src")).filter((file) =>
      singleObject.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
