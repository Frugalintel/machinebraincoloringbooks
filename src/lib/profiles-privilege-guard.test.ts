import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PROFILES_EDITABLE_COLUMNS,
  PROFILES_INSERTABLE_COLUMNS,
  PROFILES_PRIVILEGE_COLUMNS,
  PROFILES_SCORE_COLUMNS,
  evaluateIsAdminWrite,
  type PrivilegeGuardCaller,
} from "@/lib/profiles-privilege-guard";

const regularUser: PrivilegeGuardCaller = {
  currentUser: "authenticated",
  authRole: "authenticated",
  isAdminFn: false,
};

const serviceRole: PrivilegeGuardCaller = {
  currentUser: "authenticator",
  authRole: "service_role",
  isAdminFn: false,
};

const postgres: PrivilegeGuardCaller = {
  currentUser: "postgres",
  authRole: null,
  isAdminFn: false,
};

function readWorkspaceFile(...segments: string[]): string {
  return fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

function readPrivilegeMigration(): string {
  const migrationsDir = path.join(process.cwd(), "supabase/migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith("_protect_profiles_privilege_columns.sql"));

  expect(files).toHaveLength(1);
  return fs.readFileSync(path.join(migrationsDir, files[0]), "utf8");
}

describe("evaluateIsAdminWrite", () => {
  it("forces is_admin false when a regular user inserts their own row", () => {
    expect(
      evaluateIsAdminWrite(regularUser, {
        op: "INSERT",
        oldIsAdmin: null,
        newIsAdmin: true,
      }),
    ).toEqual({ allowed: true, resultingIsAdmin: false });
  });

  it("blocks a regular user from flipping is_admin on their own row", () => {
    expect(
      evaluateIsAdminWrite(regularUser, {
        op: "UPDATE",
        oldIsAdmin: false,
        newIsAdmin: true,
      }),
    ).toEqual({ allowed: false, reason: "cannot change is_admin" });
  });

  it("allows a normal profile field update that does not change is_admin", () => {
    expect(
      evaluateIsAdminWrite(regularUser, {
        op: "UPDATE",
        oldIsAdmin: false,
        newIsAdmin: false,
      }),
    ).toEqual({ allowed: true, resultingIsAdmin: false });
  });

  it("does not treat is_admin() from the NEW row as enough to escalate", () => {
    expect(
      evaluateIsAdminWrite(
        { ...regularUser, isAdminFn: false },
        { op: "UPDATE", oldIsAdmin: false, newIsAdmin: true },
      ),
    ).toEqual({ allowed: false, reason: "cannot change is_admin" });
  });

  it("allows an existing admin by OLD state to change is_admin", () => {
    expect(
      evaluateIsAdminWrite(
        { ...regularUser, isAdminFn: true },
        { op: "UPDATE", oldIsAdmin: true, newIsAdmin: false },
      ),
    ).toEqual({ allowed: true, resultingIsAdmin: false });
  });

  it("allows service_role and postgres to insert or update is_admin", () => {
    expect(
      evaluateIsAdminWrite(serviceRole, {
        op: "INSERT",
        oldIsAdmin: null,
        newIsAdmin: true,
      }),
    ).toEqual({ allowed: true, resultingIsAdmin: true });
    expect(
      evaluateIsAdminWrite(postgres, {
        op: "UPDATE",
        oldIsAdmin: false,
        newIsAdmin: true,
      }),
    ).toEqual({ allowed: true, resultingIsAdmin: true });
  });
});

describe("profiles privilege migration SQL", () => {
  it("installs a BEFORE INSERT OR UPDATE guard for is_admin only", () => {
    const sql = readPrivilegeMigration();

    expect(PROFILES_PRIVILEGE_COLUMNS).toEqual(["is_admin"]);
    expect(sql).toContain("BEFORE INSERT OR UPDATE");
    expect(sql).toContain("protect_profiles_privilege_columns");
    expect(sql).toContain("NEW.is_admin := false");
    expect(sql).toContain("OLD.is_admin");
    expect(sql).toContain("public.is_admin()");
    expect(sql).toContain("auth.role()");
    expect(sql).toContain("current_user");
    expect(sql).toContain("service_role");
    expect(sql).toContain("SET search_path = ''");
    expect(sql).not.toMatch(
      /SECURITY DEFINER[\s\S]{0,80}protect_profiles_privilege_columns/,
    );
  });

  it("adds WITH CHECK to the own-profile update policy and restates grants", () => {
    const sql = readPrivilegeMigration();

    expect(sql).toContain('DROP POLICY IF EXISTS "Users update own profile"');
    expect(sql).toContain("WITH CHECK (auth.uid() = id)");
    expect(sql).toContain('CREATE POLICY "Users insert own profile"');
    expect(sql).toContain('CREATE POLICY "Public profiles"');
    expect(sql).toContain(
      "GRANT SELECT ON TABLE public.profiles TO anon, authenticated",
    );
    expect(sql).toContain("GRANT ALL ON TABLE public.profiles TO service_role");
    expect(sql).toContain("TO anon, authenticated");
  });

  it("revokes is_admin writes from anon and authenticated without blocking editable columns", () => {
    const sql = readPrivilegeMigration();

    expect(sql).toContain(
      "REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.profiles FROM anon, authenticated",
    );
    expect(sql).toMatch(
      /GRANT INSERT \([\s\S]*?\) ON TABLE public\.profiles TO anon, authenticated/,
    );
    expect(sql).toMatch(
      /GRANT UPDATE \([\s\S]*?\) ON TABLE public\.profiles TO anon, authenticated/,
    );

    const insertGrant = sql.match(
      /GRANT INSERT \(([\s\S]*?)\) ON TABLE public\.profiles TO anon, authenticated/,
    )?.[1];
    const updateGrant = sql.match(
      /GRANT UPDATE \(([\s\S]*?)\) ON TABLE public\.profiles TO anon, authenticated/,
    )?.[1];

    expect(insertGrant).toBeTruthy();
    expect(updateGrant).toBeTruthy();
    for (const column of PROFILES_INSERTABLE_COLUMNS) {
      expect(insertGrant).toContain(column);
    }
    for (const column of PROFILES_EDITABLE_COLUMNS) {
      expect(updateGrant).toContain(column);
    }
    expect(insertGrant).not.toContain("is_admin");
    expect(updateGrant).not.toContain("is_admin");
    expect(sql).not.toMatch(/GRANT (INSERT|UPDATE) \([^)]*is_admin/i);
    expect(PROFILES_INSERTABLE_COLUMNS).not.toContain("is_admin");
    expect(PROFILES_EDITABLE_COLUMNS).not.toContain("is_admin");
  });

  it("hardens handle_new_user without copying is_admin from metadata", () => {
    const sql = readPrivilegeMigration();

    expect(sql).toContain(
      "CREATE OR REPLACE FUNCTION public.handle_new_user()",
    );
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("INSERT INTO public.profiles (id, email, is_admin)");
    expect(sql).toContain("false");
    expect(sql).not.toMatch(/raw_user_meta_data\s*->>\s*'is_admin'/);
    expect(sql).not.toMatch(/raw_app_meta_data\s*->>\s*'is_admin'/);
  });

  it("leaves self-editable score columns out of the privilege guard", () => {
    const sql = readPrivilegeMigration();
    const src = readWorkspaceFile("src/context/game-context.tsx");

    expect(PROFILES_SCORE_COLUMNS).toEqual([
      "total_xp",
      "collector_score",
      "achievement_score",
    ]);
    expect(src).toContain('.from("profiles")');
    expect(src).toContain("total_xp");
    expect(src).toContain(".update({ total_xp:");
    expect(sql).not.toContain("NEW.total_xp");
    expect(sql).not.toContain("NEW.collector_score");
    expect(sql).not.toContain("NEW.achievement_score");
  });
});

describe("profiles privilege SQL test file", () => {
  it("proves a regular user cannot flip is_admin and can still edit profile fields", () => {
    const sql = readWorkspaceFile(
      "supabase/tests/protect_profiles_privilege_columns.sql",
    );

    expect(sql).toContain("SET LOCAL ROLE authenticated");
    expect(sql).toContain("is_admin = true");
    expect(sql).toMatch(/permission denied|42501|cannot change/);
    expect(sql).toContain("display_name");
    expect(sql).toContain("total_xp");
    expect(sql).toContain("INSERT INTO public.profiles");
  });
});
