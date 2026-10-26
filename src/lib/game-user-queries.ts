export const GAME_USER_TABLES = [
  "user_achievements",
  "user_collectibles",
  "user_active_achievements",
  "user_story_progress",
  "profiles",
  "user_books",
  "user_trophy_customizations",
] as const;

export function gameFetchPlan(userId: string | null | undefined): {
  userTables: readonly string[];
} {
  if (!userId) return { userTables: [] };
  return { userTables: GAME_USER_TABLES };
}
