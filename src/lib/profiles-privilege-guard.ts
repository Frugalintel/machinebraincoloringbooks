export const PROFILES_PRIVILEGE_COLUMNS = ["is_admin"] as const;

export const PROFILES_SCORE_COLUMNS = [
  "total_xp",
  "collector_score",
  "achievement_score",
] as const;

export const PROFILES_EDITABLE_COLUMNS = [
  "email",
  "display_name",
  "avatar_url",
  "total_xp",
  "collector_score",
  "achievement_score",
  "display_title",
  "profile_frame",
  "updated_at",
] as const;

export const PROFILES_INSERTABLE_COLUMNS = [
  "id",
  "email",
  "display_name",
  "avatar_url",
  "total_xp",
  "collector_score",
  "achievement_score",
  "display_title",
  "profile_frame",
  "created_at",
  "updated_at",
] as const;

export type ProfileWriteOp = "INSERT" | "UPDATE";

export type PrivilegeGuardCaller = {
  currentUser: string;
  authRole: string | null;
  isAdminFn: boolean;
};

export type PrivilegeGuardChange = {
  op: ProfileWriteOp;
  oldIsAdmin: boolean | null;
  newIsAdmin: boolean;
};

export type PrivilegeGuardResult =
  | { allowed: true; resultingIsAdmin: boolean }
  | { allowed: false; reason: "cannot change is_admin" };

function assertNever(value: never): never {
  throw new Error(
    `unexpected profiles privilege guard value: ${String(value)}`,
  );
}

export function isPrivilegeBypassCaller(caller: PrivilegeGuardCaller): boolean {
  return (
    caller.currentUser === "postgres" ||
    caller.currentUser === "supabase_admin" ||
    caller.authRole === "service_role"
  );
}

export function evaluateIsAdminWrite(
  caller: PrivilegeGuardCaller,
  change: PrivilegeGuardChange,
): PrivilegeGuardResult {
  const bypass = isPrivilegeBypassCaller(caller);

  switch (change.op) {
    case "INSERT":
      return {
        allowed: true,
        resultingIsAdmin: bypass ? change.newIsAdmin : false,
      };
    case "UPDATE": {
      if (change.newIsAdmin === change.oldIsAdmin) {
        return {
          allowed: true,
          resultingIsAdmin: change.newIsAdmin,
        };
      }

      const existingAdminByOldState = change.oldIsAdmin === true;
      if (bypass || existingAdminByOldState || caller.isAdminFn) {
        return {
          allowed: true,
          resultingIsAdmin: change.newIsAdmin,
        };
      }

      return { allowed: false, reason: "cannot change is_admin" };
    }
    default:
      return assertNever(change.op);
  }
}
